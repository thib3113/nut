import { createDebugger } from './utils.internal.js';
import net, { Socket } from 'node:net';
// @ts-ignore
import queue from 'async/queue';
import type { QueueObject } from './QueueObject.js';
import { checkError, parseLine, parseList } from './utils.js';
import tls from 'node:tls';
import type { ConnectionOptions, TLSSocket } from 'tls';

type messageCallback = (message: string) => any;
interface ITask {
    cmd: string;
    timeout?: number;
}

/**
 * name of the UPS
 */
export type UPSName = string;

const debug = createDebugger('RawNUTClient');

/**
 * Reserved for advanced uses, use {@link NUTClient}
 */
export class RawNUTClient {
    private readonly _tcpClient: Socket;
    private _tlsClient?: TLSSocket;
    private receivingList: boolean = false;

    get client(): TLSSocket | Socket {
        return this._tlsClient ?? this._tcpClient;
    }

    get connected(): boolean {
        return this._connected;
    }

    set connected(value: boolean) {
        this._connected = value;

        if (value) {
            this.cmdQueue.resume();
        } else {
            this.cmdQueue.pause();
        }
    }

    private _connected = false;
    private receivedMessage = '';
    private readonly callBacks: Array<messageCallback> = [];
    private readonly cmdQueue: QueueObject<ITask>;

    constructor(host: string, port: number = 3493) {
        this.cmdQueue = queue(this.sendOneByOne, 1);
        this.cmdQueue.pause();

        this._tcpClient = net.createConnection(port, host, () => {
            debug('client connected');
            this.connected = true;
        });

        this._tcpClient.setEncoding('ascii');
        this._tcpClient.setKeepAlive(true);
        this.addListenerToSocket(this._tcpClient);
    }

    private addListenerToSocket(socket: Socket) {
        socket.on('data', (data) => {
            const receivedString = data.toString('utf8');

            debug('receiving data %o', receivedString);

            this.receivedMessage += receivedString;

            //check lists
            receivedString.split('\n').forEach((line) => {
                if (line.startsWith('BEGIN LIST')) {
                    this.receivingList = true;
                }

                if (line.startsWith('END LIST')) {
                    this.receivingList = false;
                }
            });

            if (this.receivingList || receivedString.endsWith('\n')) {
                return;
            }

            const nextCb = this.callBacks.shift();
            if (nextCb) {
                const message = this.receivedMessage.trim();
                this.receivedMessage = '';
                debug('received message %o', message);

                nextCb(message);
            } else {
                debug('received orphan message %o', this.receivedMessage);
            }
        });

        socket.on('error', (e) => {
            debug('client error: %O', e);
        });
        socket.on('close', () => {
            debug('connection closed');
            socket.destroySoon();
            this.connected = false;
        });
    }

    public async startTLS(tlsOptions?: Omit<ConnectionOptions, 'socket' | 'host' | 'port'>): Promise<void> {
        if (checkError(await this.send(['STARTTLS'])) !== 'OK STARTTLS') {
            throw new Error('fail to init starttls');
        }

        return new Promise<void>((resolve) => {
            this._tlsClient = tls.connect(
                {
                    ...tlsOptions,
                    socket: this._tcpClient
                },
                resolve
            );

            this.addListenerToSocket(this._tlsClient);
        });
    }

    private readonly sendOneByOne = async (cmdObject?: ITask) => {
        const { cmd, timeout } = cmdObject ?? {};

        if (!cmd) {
            throw new Error('you need to pass a cmd');
        }

        const promisesWithTimeout: Array<unknown> = [
            new Promise((resolve, reject) => {
                const onError = (e: Error) => {
                    debug('client error: %O', e);
                    reject(e);
                };
                this.client.once('error', onError);
                this.callBacks.push((str) => {
                    try {
                        this.client.off('error', onError);
                        resolve(checkError(str));
                    } catch (e) {
                        reject(e as Error);
                    }
                });
            })
        ];

        if (timeout) {
            promisesWithTimeout.push(new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout)));
        }

        const promise = Promise.race(promisesWithTimeout);

        debug('send command %s', cmd);
        this.client.write(`${cmd}\n`);

        return promise;
    };

    /**
     * allow to send custom command
     * @param cmdParts
     * @param timeout
     */
    async send(cmdParts: Array<string>, timeout?: number): Promise<string> {
        return this.cmdQueue
            .pushAsync<string>({
                cmd: cmdParts.map((p) => `"${p.replace('\\', '\\\\')}"`).join(' '),
                timeout
            })
            .then((message: string): string => checkError(message));
    }

    async connect(username: string, password: string) {
        if (checkError(await this.send(['USERNAME', username])) !== 'OK' || checkError(await this.send(['PASSWORD', password])) !== 'OK') {
            throw new Error('Fail to connect');
        }
    }

    /**
     * @remarks You probably shouldn’t send this command unless you are upsmon, or a upsmon replacement.
     * @param ups {string} the name of the UPS
     */
    async login(ups: string): Promise<string> {
        return checkError(await this.send(['LOGIN', ups]));
    }

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
     * get network protocol version
     */
    async help(): Promise<string> {
        return checkError(await this.send(['HELP']));
    }
    /**
     * get network protocol version
     */
    async listUPS(): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'UPS']));
        return parseList(list);
    }

    async listVariables(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'VAR', ups]));
        return parseList(list);
    }

    async listCommands(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'CMD', ups]));
        return parseList(list);
    }

    async getVariableType(ups: UPSName, variable: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'TYPE', ups, variable]))).pop() ?? '';
    }

    async getVariableDescription(ups: UPSName, variable: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'DESC', ups, variable]))).pop() ?? '';
    }

    async getVariableEnum(ups: UPSName, variable: string): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'ENUM', ups, variable]));
        return parseList(list);
    }

    async getVariableRange(ups: UPSName, variable: string): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'RANGE', ups, variable]));
        return parseList(list);
    }

    async getVariable(ups: UPSName, variable: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'VAR', ups, variable]))).pop() ?? '';
    }

    async setVariable(ups: UPSName, variable: string, value: unknown): Promise<string> {
        return checkError(await this.send(['SET', 'VAR', ups, variable, value?.toString() ?? '']));
    }

    async getCommandDescription(ups: UPSName, command: string): Promise<string> {
        return parseLine(checkError(await this.send(['GET', 'CMDDESC', ups, command]))).pop() ?? '';
    }

    async runCommand(ups: UPSName, command: string): Promise<string> {
        return checkError(await this.send(['INSTCMD', ups, command]));
    }

    async listClients(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'CLIENT', ups]));
        return parseList(list);
    }

    async listWriteableVariables(ups: UPSName): Promise<Array<string>> {
        const list = checkError(await this.send(['LIST', 'RW', ups]));
        return parseList(list);
    }

    async getNumLogins(ups: UPSName): Promise<number> {
        return Number(parseLine(checkError(await this.send(['GET', 'NUMLOGINS', ups]))).pop());
    }
}
