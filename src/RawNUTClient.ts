import { createDebugger } from './utils.internal.js';
import net, { Socket } from 'node:net';
import { queue } from 'async';
import type { QueueObject } from 'async';
import { checkError, parseLine, parseList, escapeCommandPart } from './utils.js';
import tls from 'node:tls';
import type { ConnectionOptions, TLSSocket } from 'tls';
import { TypedEmitter } from 'tiny-typed-emitter';
import { ConnectionLostError } from './Errors/ConnectionLostError.js';

type messageCallback = (message: string) => any;
interface ITask {
    cmd: string;
    timeout?: number;
}

/**
 * name of the UPS
 */
export type UPSName = string;

/**
 * Options for RawNUTClient.
 */
export interface IRawNUTClientOptions {
    /** Default timeout for commands (ms). If not set or set to Infinity, commands have no timeout. */
    timeout?: number;
    /** Timeout for initial TCP connection (ms). Default: 10000 */
    connectTimeout?: number;
}

export interface RawNUTClientEvents {
    /** Emitted when the TCP connection is successfully established. */
    connected: () => void;
    /** Emitted when the connection is lost (socket closed after being connected). */
    disconnected: () => void;
}

const debug = createDebugger('RawNUTClient');

/**
 * Reserved for advanced uses, use {@link NUTClient}
 */
export class RawNUTClient extends TypedEmitter<RawNUTClientEvents> {
    #tcpClient!: Socket;
    #tlsClient?: TLSSocket;
    #receivingList: boolean = false;
    #connected = false;
    #receivedMessage = '';
    #callBacks: Array<messageCallback> = [];
    #cmdQueue: QueueObject<ITask>;
    #defaultTimeout?: number;
    #connectTimeout: number;
    #host: string;
    #port: number;

    /**
     * Get the underlying TCP or TLS socket.
     *
     * @remarks This exposes the internal socket for advanced use cases (e.g., checking readyState).
     * Direct manipulation of the socket may break client invariants. Use with caution.
     *
     * @returns The TLS socket if TLS is active, otherwise the TCP socket
     */
    get client(): TLSSocket | Socket {
        return this.#tlsClient ?? this.#tcpClient;
    }

    get connected(): boolean {
        return this.#connected;
    }

    set connected(value: boolean) {
        this.#connected = value;

        if (value) {
            this.#cmdQueue.resume();
            this.emit('connected');
        } else {
            this.#cmdQueue.pause();
        }
    }

    constructor(host: string, port: number = 3493, options?: IRawNUTClientOptions) {
        super();

        this.#host = host;
        this.#port = port;
        this.#defaultTimeout = options?.timeout;
        this.#connectTimeout = options?.connectTimeout ?? 10000;

        this.#cmdQueue = queue(this.#sendOneByOne, 1);
        this.#cmdQueue.pause();

        this.#tcpClient = net.createConnection(this.#port, this.#host, () => {
            debug('client connected');
            this.connected = true;
        });

        this.#tcpClient.setTimeout(this.#connectTimeout, () => {
            if (!this.#connected) {
                this.#tcpClient.destroy(new Error('Connection timeout'));
            }
        });

        this.#tcpClient.setEncoding('ascii');
        this.#tcpClient.setKeepAlive(true);
        this.#addListenerToSocket(this.#tcpClient);
    }

    /**
     * Destroy the client and release all resources.
     * After calling destroy(), the client cannot be reused.
     *
     * - Destroys the TCP socket (and TLS socket if active)
     * - Kills the command queue
     * - Sets connected = false
     *
     * Safe to call multiple times (idempotent).
     */
    destroy(): void {
        // Destroy TLS socket if active
        if (this.#tlsClient) {
            this.#tlsClient.removeAllListeners();
            this.#tlsClient.destroy();
            this.#tlsClient = undefined;
        }

        // Destroy TCP socket
        if (this.#tcpClient) {
            this.#tcpClient.removeAllListeners();
            this.#tcpClient.destroy();
        }

        // Kill the command queue (empties pending tasks, prevents new ones)
        this.#cmdQueue.kill();

        // Mark as disconnected
        this.#connected = false;

        // Remove all event listeners from the EventEmitter
        this.removeAllListeners();
    }

    #addListenerToSocket(socket: Socket | TLSSocket) {
        socket.on('data', (data) => {
            const receivedString = data.toString('utf8');

            debug('receiving data %o', receivedString);

            this.#receivedMessage += receivedString;

            //check lists
            if (receivedString.includes('LIST')) {
                const lastBegin = receivedString.lastIndexOf('BEGIN LIST');
                const lastEnd = receivedString.lastIndexOf('END LIST');
                debug(
                    'LIST detection: receivedString=%o, lastBegin=%o, lastEnd=%o, receivingList=%o',
                    receivedString,
                    lastBegin,
                    lastEnd,
                    this.#receivingList
                );
                if (lastBegin > lastEnd && (lastBegin === 0 || receivedString[lastBegin - 1] === '\n')) {
                    this.#receivingList = true;
                    debug('Setting receivingList=true based on chunk');
                } else if (lastEnd > lastBegin && (lastEnd === 0 || receivedString[lastEnd - 1] === '\n')) {
                    this.#receivingList = false;
                    debug('Setting receivingList=false based on chunk');
                }
            }

            debug('Full receivedMessage so far: %o', this.#receivedMessage);
            debug('receivingList=%o, endsWithNewline=%o', this.#receivingList, this.#receivedMessage.endsWith('\n'));

            if (this.#receivingList || !this.#receivedMessage.endsWith('\n')) {
                return;
            }

            const nextCb = this.#callBacks.shift();
            if (nextCb) {
                const message = this.#receivedMessage.trim();
                this.#receivedMessage = '';
                debug('received message %o', message);

                nextCb(message);
            } else {
                debug('received orphan message %o', this.#receivedMessage);
            }
        });

        socket.on('error', (e) => {
            debug('client error: %O', e);
        });
        socket.on('close', () => {
            debug('connection closed');
            socket.destroySoon();
            const wasConnected = this.#connected;
            this.connected = false;

            // Clean up orphaned callbacks — in-flight commands are rejected
            // via the 'close' listener installed in sendOneByOne.
            this.#callBacks.length = 0;

            if (wasConnected) {
                this.emit('disconnected');
            }
        });
    }

    public async startTLS(tlsOptions?: Omit<ConnectionOptions, 'socket' | 'host' | 'port'>): Promise<void> {
        if (checkError(await this.send(['STARTTLS'])) !== 'OK STARTTLS') {
            throw new Error('fail to init starttls');
        }

        return new Promise<void>((resolve) => {
            this.#tlsClient = tls.connect(
                {
                    ...tlsOptions,
                    socket: this.#tcpClient
                },
                resolve
            );

            this.#addListenerToSocket(this.#tlsClient);
        });
    }

    #sendOneByOne = async (cmdObject: ITask) => {
        const { cmd, timeout } = cmdObject;

        if (!cmd) {
            throw new Error('you need to pass a cmd');
        }

        let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

        const mainPromise = new Promise<string>((resolve, reject) => {
            const onError = (e: Error) => {
                debug('client error: %O', e);
                this.client.off('close', onClose);
                reject(e);
            };
            const onClose = () => {
                debug('client closed during command execution');
                this.client.off('error', onError);
                reject(new ConnectionLostError());
            };
            this.client.once('error', onError);
            this.client.once('close', onClose);
            this.#callBacks.push((str) => {
                this.client.off('error', onError);
                this.client.off('close', onClose);
                resolve(str);
            });
        });

        // Clear timeout when main promise settles (success or error)
        // .catch() prevents unhandled rejection on this derived promise (the caller catches the original)
        mainPromise
            .finally(() => {
                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                }
            })
            .catch(() => {});

        if (timeout && timeout !== Infinity) {
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutTimer = setTimeout(() => reject(new Error('timeout')), timeout);
            });

            debug('send command %s', cmd);
            this.client.write(`${cmd}\n`);

            return Promise.race([mainPromise, timeoutPromise]);
        }

        debug('send command %s', cmd);
        this.client.write(`${cmd}\n`);

        return mainPromise;
    };

    /**
     * allow to send custom command
     * @param cmdParts
     * @param timeout - Timeout in milliseconds. Use Infinity for no timeout.
     */
    async send(cmdParts: Array<string>, timeout?: number): Promise<string> {
        const effectiveTimeout = timeout ?? this.#defaultTimeout;
        return this.#cmdQueue
            .pushAsync<string>({
                cmd: cmdParts.map((p) => `"${escapeCommandPart(p)}"`).join(' '),
                timeout: effectiveTimeout
            })
            .then((message: string): string => checkError(message));
    }

    /**
     * Authenticate with the NUT server using username and password.
     * @throws Error if authentication fails
     */
    async connect(username: string, password: string) {
        if (checkError(await this.send(['USERNAME', username])) !== 'OK' || checkError(await this.send(['PASSWORD', password])) !== 'OK') {
            throw new Error('Fail to connect');
        }
    }

    /**
     * @remarks You probably shouldn't send this command unless you are upsmon, or a upsmon replacement.
     * @param ups {string} the name of the UPS
     */
    async login(ups: string): Promise<string> {
        return checkError(await this.send(['LOGIN', ups]));
    }

    /**
     * Log out from the NUT server.
     */
    async logout(): Promise<string> {
        return checkError(await this.send(['LOGOUT']));
    }

    /**
     * get server version
     */
    async version(): Promise<string> {
        return checkError(await this.send(['VER']));
    }

    /**
     * get network protocol version
     */
    async netVersion(): Promise<string> {
        return checkError(await this.send(['NETVER']));
    }
    /**
     * Get help information from the NUT server.
     * Returns a list of available commands.
     */
    async help(): Promise<string> {
        return checkError(await this.send(['HELP']));
    }
    /**
     * List available UPS devices on the NUT server.
     * Returns an array of UPS names.
     */
    async listUPS(): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'UPS']));
        return parseList(list);
    }

    /**
     * List all variables for a UPS.
     * Returns an array of variable names.
     */
    async listVariables(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'VAR', ups]));
        return parseList(list);
    }

    /**
     * List instant commands for a UPS.
     * Returns an array of command names.
     */
    async listCommands(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'CMD', ups]));
        return parseList(list);
    }

    /**
     * Get the type of a variable for a UPS.
     * Returns the variable type (e.g., "STRING", "NUMBER", "ENUM", "RW").
     */
    async getVariableType(ups: UPSName, variable: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'TYPE', ups, variable]))).pop() ?? '';
    }

    /**
     * Get the description of a variable for a UPS.
     * Returns a human-readable description of the variable.
     */
    async getVariableDescription(ups: UPSName, variable: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'DESC', ups, variable]))).pop() ?? '';
    }

    /**
     * Get the list of valid enum values for a variable.
     * Returns an array of valid values for ENUM-type variables.
     */
    async getVariableEnum(ups: UPSName, variable: string): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'ENUM', ups, variable]));
        return parseList(list);
    }

    /**
     * Get the valid range for a variable.
     * Returns an array of valid ranges for RANGE-type variables.
     */
    async getVariableRange(ups: UPSName, variable: string): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'RANGE', ups, variable]));
        return parseList(list);
    }

    /**
     * Get the current value of a variable for a UPS.
     * Returns the variable value as a string.
     */
    async getVariable(ups: UPSName, variable: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'VAR', ups, variable]))).pop() ?? '';
    }

    /**
     * Set the value of a variable for a UPS.
     * Only works for read-write (RW) variables.
     */
    async setVariable(ups: UPSName, variable: string, value: unknown): Promise<string> {
        return checkError(await this.send(['SET', 'VAR', ups, variable, value?.toString() ?? '']));
    }

    /**
     * Get the description of an instant command.
     * Returns a human-readable description of the command.
     */
    async getCommandDescription(ups: UPSName, command: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'CMDDESC', ups, command]))).pop() ?? '';
    }

    /**
     * Run an instant command on a UPS.
     * Returns the result of the command execution.
     */
    async runCommand(ups: UPSName, command: string): Promise<string> {
        return checkError(await this.send(['INSTCMD', ups, command]));
    }

    /**
     * List clients connected to a UPS.
     * Returns an array of client identifiers.
     */
    async listClients(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'CLIENT', ups]));
        return parseList(list);
    }

    /**
     * List read-write variables for a UPS.
     * Returns an array of variable names that can be set.
     */
    async listWriteableVariables(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'RW', ups]));
        return parseList(list);
    }

    /**
     * Get the number of clients logged into a UPS.
     * Returns the count of active logins.
     */
    async getNumLogins(ups: UPSName): Promise<number> {
        return Number(parseLine(checkError(await this.send(['GET', 'NUMLOGINS', ups]))).pop());
    }

    /**
     * Set this client as master for the UPS
     * @remarks You probably shouldn't send this command unless you are upsmon, or a upsmon replacement.
     */
    async master(ups: UPSName): Promise<string> {
        return checkError(await this.send(['MASTER', ups]));
    }

    /**
     * Check if this client is master for the UPS
     */
    async getMaster(ups: UPSName): Promise<boolean> {
        return parseLine(checkError(await this.send(['GET', 'MASTER', ups]))).pop() === 'ON';
    }
}
