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
    readonly #tcpClient: Socket;
    #tlsClient?: TLSSocket;
    #receivingList: boolean = false;
    #connected = false;
    #receivedMessage = '';
    #callBacks: Array<messageCallback> = [];
    readonly #cmdQueue: QueueObject<ITask>;
    readonly #defaultTimeout?: number;
    readonly #connectTimeout: number;
    readonly #host: string;
    readonly #port: number;

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

    private set connected(value: boolean) {
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

        this.#tcpClient.removeAllListeners();
        this.#tcpClient.destroy();

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
            if (/(?:^|\n)(?:BEGIN LIST|END LIST)/.test(this.#receivedMessage)) {
                const lastBegin = this.#receivedMessage.lastIndexOf('BEGIN LIST');
                const lastEnd = this.#receivedMessage.lastIndexOf('END LIST');
                debug(
                    'LIST detection: receivedMessage=%o, lastBegin=%o, lastEnd=%o, receivingList=%o',
                    this.#receivedMessage,
                    lastBegin,
                    lastEnd,
                    this.#receivingList
                );
                if (lastBegin > lastEnd) {
                    this.#receivingList = true;
                    debug('Setting receivingList=true based on buffer');
                } else {
                    this.#receivingList = false;
                    debug('Setting receivingList=false based on buffer');
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
            this.#receivingList = false;

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
            throw new Error('failed to init starttls');
        }

        return new Promise<void>((resolve, reject) => {
            const onSecureConnect = () => {
                this.#tlsClient?.off('error', onError);
                resolve();
            };

            this.#tlsClient = tls.connect(
                {
                    ...tlsOptions,
                    socket: this.#tcpClient
                },
                onSecureConnect
            );

            const onError = (err: Error) => {
                this.#tlsClient?.off('secureConnect', onSecureConnect);
                reject(err);
            };

            this.#tlsClient.once('error', onError);
            this.#tcpClient.removeAllListeners('data');
            this.#tcpClient.removeAllListeners('error');
            this.#tcpClient.removeAllListeners('close');
            this.#addListenerToSocket(this.#tlsClient);
        });
    }

    #sendOneByOne = async (cmdObject: ITask) => {
        const { cmd, timeout } = cmdObject;

        if (!cmd) {
            throw new Error('you need to pass a cmd');
        }

        // Mask credentials in debug output — show first 3 chars to help with debugging
        const debugCmd = cmd.replace(/"(USERNAME|PASSWORD)"\s+"([^"]*)"/g, (_, type, value) => `"${type}" "${value.substring(0, 3)}***"`);

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

            debug('send command %s', debugCmd);
            this.client.write(`${cmd}\n`);

            return Promise.race([mainPromise, timeoutPromise]);
        }

        debug('send command %s', debugCmd);
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
        await this.send(['USERNAME', username]);
        await this.send(['PASSWORD', password]);
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
     * @returns Array of raw protocol strings in format: `'upsname "description"'`
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
     *
     * @param ups - The name of the UPS
     * @param variable - The variable name
     * @param value - The value to set
     * @returns Raw server response ('OK' or 'OK TRACKING <uuid>')
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
     * @param ups - The name of the UPS
     * @param command - The command name
     * @param param - Optional command parameter (e.g., delay in seconds)
     * @returns Raw server response ('OK' or 'OK TRACKING <uuid>')
     */
    async runCommand(ups: UPSName, command: string, param?: string): Promise<string> {
        const cmdParts = ['INSTCMD', ups, command];
        if (param !== undefined) {
            cmdParts.push(param);
        }
        return checkError(await this.send(cmdParts));
    }

    /**
     * Get the description of a UPS (from ups.conf desc= field).
     * @param ups - The name of the UPS
     * @returns The UPS description string, or "Unavailable" if not configured
     */
    async getUPSDescription(ups: UPSName): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'UPSDESC', ups]))).pop() ?? '';
    }

    /**
     * Force a shutdown on the UPS (set the FSD flag).
     * Used by upsmon primary to signal secondaries to shut down before power loss.
     * @param ups - The name of the UPS
     * @returns The server response (e.g., "OK FSD-SET")
     * @remarks Requires master or FSD permission in upsd.users. Use with caution.
     */
    async forceShutdown(ups: UPSName): Promise<string> {
        return checkError(await this.send(['FSD', ups]));
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
        return Number(parseLine(checkError(await this.send(['GET', 'NUMLOGINS', ups]))).pop() ?? '');
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
        return (parseLine(checkError(await this.send(['GET', 'MASTER', ups]))).pop() ?? '') === 'ON';
    }

    /**
     * Enable or disable command tracking for idempotent write operations.
     *
     * When tracking is enabled, write commands (SET VAR, INSTCMD) return
     * `OK TRACKING <uuid>` instead of `OK`. The NUTClient facade parses this
     * response into a structured {@link CommandResult} object.
     *
     * Each tracked command generates a unique UUID. Read operations (GET VAR, LIST)
     * are not tracked.
     *
     * @param enabled - `true` to enable tracking, `false` to disable
     * @returns The raw server response (e.g. `'OK TRACKING'` or `'OK'`)
     * @remarks Requires NUT 2.8.0+ (protocol v1.3) on the server. Use {@link NUTClient}
     * for automatic parsing and {@link TrackingOptions.followTracking} for automatic polling.
     */
    async setTracking(enabled: boolean): Promise<string> {
        return checkError(await this.send(['SET', 'TRACKING', enabled ? 'ON' : 'OFF']));
    }

    /**
     * Get the status of a previously tracked write command by its UUID.
     *
     * After enabling tracking via {@link setTracking}, write commands return
     * `OK TRACKING <uuid>`. This method polls the server for the outcome of
     * that specific command.
     *
     * @param uuid - The tracking UUID returned by a write command
     * @returns `'PENDING'` if the command is still executing, `'SUCCESS'` if it
     * completed successfully, or `'ERR'` if it failed
     * @remarks Requires NUT 2.8.0+ (protocol v1.3) on the server.
     */
    async getTracking(uuid: string): Promise<string> {
        return checkError(await this.send(['GET', 'TRACKING', uuid]));
    }
}
