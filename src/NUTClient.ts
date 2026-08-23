import { UPS } from './UPS.js';
import { RawNUTClient, UPSName } from './RawNUTClient.js';
import type { IRawNUTClientOptions } from './RawNUTClient.js';
import { parseLine, variableTypeConverter } from './utils.js';
import type { nutVariables, nutVariablesNames } from './NUTVariables.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { createDebugger } from './utils.internal.js';
import type { ConnectionOptions } from 'node:tls';
import type { CommandResult, TrackedResult, TrackingOptions } from './TrackingTypes.js';

export interface INUTClientOptions extends IRawNUTClientOptions {
    /** Enable auto-reconnect on connection loss. Default: false */
    autoReconnect?: boolean;
    /** Initial delay before reconnect attempt (ms). Default: 1000 */
    reconnectDelay?: number;
    /** Maximum delay between reconnect attempts (ms). Default: 30000 */
    maxReconnectDelay?: number;
    /** Multiplier for exponential backoff. Default: 2 */
    reconnectBackoff?: number;
    /** Maximum number of reconnect attempts before giving up. Default: Infinity */
    maxReconnectAttempts?: number;
    /** Username for authentication. Stored and re-sent automatically after reconnect. */
    username?: string;
    /** Password for authentication. Stored and re-sent automatically after reconnect. */
    password?: string;
}

export interface NUTClientEvents {
    /** Emitted when the connection is lost (before any reconnect attempt). */
    disconnected: () => void;
    /** Emitted when a reconnect attempt is about to be scheduled. */
    reconnecting: (attempt: number, delay: number) => void;
    /** Emitted when the connection has been successfully re-established. */
    reconnected: () => void;
    /** Emitted when a reconnect attempt fails. */
    reconnectFailed: (attempt: number) => void;
    /** Emitted when maxReconnectAttempts is reached and no further attempts will be made. */
    reconnectExhausted: () => void;
    /** Emitted when the client is destroyed. */
    destroyed: () => void;
}

const debug = createDebugger('NUTClient');

export class NUTClient extends TypedEmitter<NUTClientEvents> {
    #client: RawNUTClient;
    readonly #options?: INUTClientOptions;

    // Reconnect state
    #reconnectTimer?: ReturnType<typeof setTimeout>;
    #reconnectAttempts = 0;
    #currentReconnectDelay: number;
    #reconnecting = false;
    #destroyed = false;

    // Resolved reconnect options
    readonly #autoReconnect: boolean;
    readonly #reconnectDelay: number;
    readonly #maxReconnectDelay: number;
    readonly #reconnectBackoff: number;
    readonly #maxReconnectAttempts: number;

    // Authentication state (restored automatically after reconnect)
    #username?: string;
    #password?: string;
    #loggedInUps: Set<string> = new Set();

    // TLS state (restored automatically after reconnect)
    #tlsActive = false;
    #tlsOptions?: Omit<ConnectionOptions, 'socket' | 'host' | 'port'>;

    // Connection parameters (stored for reconnect)
    readonly #host: string;
    readonly #port: number;

    constructor(host: string, port: number = 3493, options?: INUTClientOptions) {
        super();

        this.#host = host;
        this.#port = port;
        this.#options = options ? { ...options } : undefined;

        this.#autoReconnect = options?.autoReconnect ?? false;
        this.#reconnectDelay = options?.reconnectDelay ?? 1000;
        this.#maxReconnectDelay = options?.maxReconnectDelay ?? 30000;
        this.#reconnectBackoff = options?.reconnectBackoff ?? 2;
        this.#maxReconnectAttempts = options?.maxReconnectAttempts ?? Infinity;
        this.#currentReconnectDelay = this.#reconnectDelay;
        this.#username = options?.username;
        this.#password = options?.password;

        this.#client = new RawNUTClient(host, port, options);
        this.#setupClientListeners(this.#client);
    }

    /**
     * Check if the client is currently connected to the NUT server.
     * @returns true if connected, false otherwise
     */
    get connected(): boolean {
        return this.#client.connected;
    }

    /**
     * Static factory method that creates a NUTClient and optionally
     * authenticates when credentials are provided in options.
     * Credentials are cleared from stored options after successful authentication
     * to reduce the risk of credential leaks.
     * @param host hostname or IP address
     * @param port port number (default 3493)
     * @param options client options including optional credentials
     */
    static async create(host: string, port?: number, options?: INUTClientOptions): Promise<NUTClient> {
        const client = new NUTClient(host, port, options);
        if (options?.username && options?.password) {
            try {
                await client.connect(options.username, options.password);
            } catch (err) {
                client.destroy();
                throw err;
            }

            // Clear credentials from options object (they remain stored in #username/#password for reconnect)
            if (client.#options) {
                delete client.#options.username;
                delete client.#options.password;
            }
        }
        return client;
    }

    #setupClientListeners(client: RawNUTClient): void {
        client.on('disconnected', () => this.#handleDisconnect());
    }

    #handleDisconnect(): void {
        if (this.#destroyed || this.#reconnecting) {
            return;
        }

        this.emit('disconnected');

        if (this.#autoReconnect) {
            this.#reconnecting = true;
            this.#scheduleReconnect();
        }
    }

    #scheduleReconnect(): void {
        if (this.#destroyed) {
            return;
        }

        if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
            debug('reconnect attempts exhausted (max: %d)', this.#maxReconnectAttempts);
            this.emit('reconnectExhausted');
            return;
        }

        this.#reconnectAttempts++;
        const attempt = this.#reconnectAttempts;
        const delay = this.#currentReconnectDelay;

        debug('scheduling reconnect attempt %d in %d ms', attempt, delay);
        this.emit('reconnecting', attempt, delay);

        this.#reconnectTimer = setTimeout(() => {
            this.#reconnectTimer = undefined;
            this.#doReconnect();
        }, delay);

        // Increase delay for the next attempt (exponential backoff, capped, with ±20% jitter to prevent thundering herd)
        const baseDelay = Math.min(this.#currentReconnectDelay * this.#reconnectBackoff, this.#maxReconnectDelay);
        const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1);
        this.#currentReconnectDelay = Math.max(1, Math.round(baseDelay + jitter));
    }

    async #doReconnect(): Promise<void> {
        if (this.#destroyed) {
            return;
        }

        const attempt = this.#reconnectAttempts;

        try {
            debug('executing reconnect attempt %d', attempt);

            // Destroy old client (cleanup, listeners already removed by destroy)
            this.#client.destroy();

            // Create new RawNUTClient
            const newClient = new RawNUTClient(this.#host, this.#port, {
                timeout: this.#options?.timeout,
                connectTimeout: this.#options?.connectTimeout
            });
            this.#client = newClient;
            this.#setupClientListeners(newClient);

            // Wait for connection (event-based with timeout)
            await new Promise<void>((resolve, reject) => {
                const RECONNECT_TIMEOUT = 10000;

                const cleanup = () => {
                    clearTimeout(timeout);
                    newClient.off('connected', onConnect);
                    newClient.off('disconnected', onDisconnect);
                };

                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Reconnect connection timeout'));
                }, RECONNECT_TIMEOUT);

                const onConnect = () => {
                    cleanup();
                    resolve();
                };

                const onDisconnect = () => {
                    cleanup();
                    reject(new Error('Connection failed during reconnect'));
                };

                // Check if already connected (race: connection established before listeners)
                if (newClient.connected) {
                    cleanup();
                    resolve();
                    return;
                }

                newClient.once('connected', onConnect);
                newClient.once('disconnected', onDisconnect);
            });

            // Restore session (auth + login)
            await this.#restoreSession();

            // Success!
            this.#reconnecting = false;
            this.#reconnectAttempts = 0;
            this.#currentReconnectDelay = this.#reconnectDelay;
            debug('reconnected after %d attempts', attempt);
            this.emit('reconnected');
        } catch (err) {
            debug('reconnect attempt %d failed: %O', attempt, err);
            this.emit('reconnectFailed', attempt);

            if (!this.#destroyed) {
                this.#scheduleReconnect();
            }
        }
    }

    async #restoreSession(): Promise<void> {
        // Restore TLS first — NUT protocol requires TLS before sending credentials
        if (this.#tlsActive && this.#tlsOptions !== undefined) {
            await this.#client.startTLS(this.#tlsOptions);
        }

        if (this.#username && this.#password) {
            await this.#client.connect(this.#username, this.#password);
        }

        for (const ups of this.#loggedInUps) {
            try {
                await this.#client.login(ups);
            } catch (err) {
                debug('failed to re-login UPS %s during session restore: %O', ups, err);
            }
        }
    }

    /**
     * allow to send custom command
     * @param cmd {string[]} the command to send
     * @param timeout {number} timeout for this command
     */
    async send(cmd: Array<string>, timeout?: number): ReturnType<RawNUTClient['send']> {
        return this.#client.send(cmd, timeout);
    }

    /**
     * Allow to authenticate user on the UPS
     * @param username {string}
     * @param password {string}
     */
    async connect(username: string, password: string): ReturnType<RawNUTClient['connect']> {
        this.#username = username;
        this.#password = password;
        return this.#client.connect(username, password);
    }

    /**
     * will log out from the server
     */
    async logout(): ReturnType<RawNUTClient['logout']> {
        this.#loggedInUps.clear();
        return this.#client.logout();
    }

    /**
     * allow to upgrade the connection with TLS
     *
     * @see {RawNUTClient.startTLS} to check the arguments allowed
     */
    async startTLS(tlsOptions?: Omit<ConnectionOptions, 'socket' | 'host' | 'port'>): ReturnType<RawNUTClient['startTLS']> {
        this.#tlsOptions = tlsOptions;
        await this.#client.startTLS(tlsOptions);
        this.#tlsActive = true;
    }

    /**
     * get server version
     */
    async version(): ReturnType<RawNUTClient['version']> {
        return this.#client.version();
    }

    /**
     * get network protocol version
     */
    async netVersion(): ReturnType<RawNUTClient['netVersion']> {
        return this.#client.netVersion();
    }
    /**
     * get help
     */
    async help(): ReturnType<RawNUTClient['help']> {
        return this.#client.help();
    }
    /**
     * List all available UPS devices.
     * @returns Array of {@link UPS} objects with parsed name and description.
     */
    async listUPS(): Promise<Array<UPS>> {
        return this.#client.listUPS().then((res) =>
            res.map((l) => {
                const parts = parseLine(l);

                return new UPS(this, parts[0], parts[1] ?? '');
            })
        );
    }

    /**
     * allow to select an UPS, and get an {@link UPS} object
     * @param name {string} name of the ups to search
     */
    async getUPS(name: string): Promise<UPS | undefined> {
        const ups = await this.listUPS();
        return ups.find((u) => u.name === name);
    }

    /**
     * List all the variables of the UPS
     * @param ups {string}
     */
    async listVariables(ups: UPSName): Promise<nutVariables> {
        return this.#client.listVariables(ups).then((res) => {
            const variables: nutVariables = {} as nutVariables;
            for (const line of res) {
                const [key, value] = parseLine(line) as [nutVariablesNames, string];

                if (!key) {
                    throw new Error('failed to get key from variables');
                }

                variables[key] = value ?? '';
            }
            return variables;
        });
    }

    /**
     * list the available commands on the UPS
     * @param ups
     */
    async listCommands(ups: UPSName): ReturnType<RawNUTClient['listCommands']> {
        return this.#client.listCommands(ups);
    }

    /**
     * get the description of a variable
     * @param ups
     * @param variable
     */
    async getVariableDescription(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableDescription']> {
        return this.#client.getVariableDescription(ups, variable);
    }

    /**
     * get the type of variable ... Defined by the NUT driver, default to NUMBER
     * @param ups
     * @param variable
     */
    async getVariableType(ups: UPSName, variable: nutVariablesNames): Promise<ReturnType<typeof variableTypeConverter>> {
        return variableTypeConverter(await this.#client.getVariableType(ups, variable));
    }

    /**
     * get the description of a command
     * @param ups
     * @param command
     */
    async getCommandDescription(ups: UPSName, command: string): ReturnType<RawNUTClient['getCommandDescription']> {
        return this.#client.getCommandDescription(ups, command);
    }

    /**
     * run a command on the UPS
     * @param ups
     * @param command
     * @param param - Optional command parameter (e.g., delay in seconds)
     * @param options - Optional tracking options (followTracking, trackingTimeout, trackingPollInterval)
     */
    async runCommand(ups: UPSName, command: string, param?: string, options?: TrackingOptions): Promise<CommandResult | TrackedResult> {
        const response = await this.#client.runCommand(ups, command, param);
        const result = this.#parseCommandResponse(response);

        if (options?.followTracking && result.tracked) {
            const status = await this.#pollTracking(result.trackingUid, options);
            return { tracked: true, status };
        }

        return result;
    }

    /**
     * get the enum variables
     * @param ups
     * @param variable
     */
    async getVariableEnum(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableEnum']> {
        return this.#client.getVariableEnum(ups, variable);
    }

    /**
     * get the range of the variable
     * @param ups
     * @param variable
     */
    async getVariableRange(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableRange']> {
        return this.#client.getVariableRange(ups, variable);
    }

    /**
     * allow to set a variable
     * @param ups
     * @param variable
     * @param value
     * @param options - Optional tracking options (followTracking, trackingTimeout, trackingPollInterval)
     */
    async setVariable(
        ups: UPSName,
        variable: nutVariablesNames,
        value: unknown,
        options?: TrackingOptions
    ): Promise<CommandResult | TrackedResult> {
        const response = await this.#client.setVariable(ups, variable, value);
        const result = this.#parseCommandResponse(response);

        if (options?.followTracking && result.tracked) {
            const status = await this.#pollTracking(result.trackingUid, options);
            return { tracked: true, status };
        }

        return result;
    }

    /**
     * allow to get a variable
     * @param ups
     * @param variable
     */
    async getVariable(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariable']> {
        return this.#client.getVariable(ups, variable);
    }

    /**
     * List the logged clients on the UPS
     * @param ups
     */
    async listClients(ups: UPSName): ReturnType<RawNUTClient['listClients']> {
        return this.#client.listClients(ups);
    }

    /**
     * List writeable variables for a UPS.
     * @returns Object mapping variable names to their current values
     * @remarks Unlike RawNUTClient which returns raw strings, this method parses the response into a key-value object
     */
    async listWriteableVariables(ups: UPSName): Promise<Record<string, string>> {
        return this.#client.listWriteableVariables(ups).then((res) => {
            const variables: Record<string, string> = {};
            for (const line of res) {
                const [key, value] = parseLine(line);

                if (!key) {
                    throw new Error('failed to get key from variables');
                }

                variables[key] = value ?? '';
            }
            return variables;
        });
    }

    /**
     * @inheritDoc RawNUTClient.login
     */
    async login(ups: UPSName): ReturnType<RawNUTClient['login']> {
        this.#loggedInUps.add(ups);
        try {
            const result = await this.#client.login(ups);
            return result;
        } catch (err) {
            this.#loggedInUps.delete(ups);
            throw err;
        }
    }

    /**
     * get number of clients logged (using LOGIN command)
     * @param ups
     */
    async getNumLogins(ups: UPSName): ReturnType<RawNUTClient['getNumLogins']> {
        return this.#client.getNumLogins(ups);
    }

    /**
     * @inheritDoc RawNUTClient.master
     */
    async master(ups: UPSName): ReturnType<RawNUTClient['master']> {
        return this.#client.master(ups);
    }

    /**
     * Check if this client is master for the UPS
     * @param ups
     */
    async getMaster(ups: UPSName): ReturnType<RawNUTClient['getMaster']> {
        return this.#client.getMaster(ups);
    }

    /**
     * Get the description of a UPS (from ups.conf desc= field).
     * @param ups - The name of the UPS
     * @returns The UPS description string
     */
    async getUPSDescription(ups: UPSName): ReturnType<RawNUTClient['getUPSDescription']> {
        return this.#client.getUPSDescription(ups);
    }

    /**
     * Force a shutdown on the UPS (set the FSD flag).
     * @param ups - The name of the UPS
     * @returns The server response
     * @remarks Requires master or FSD permission. Use with caution.
     */
    async forceShutdown(ups: UPSName): ReturnType<RawNUTClient['forceShutdown']> {
        return this.#client.forceShutdown(ups);
    }

    /**
     * Enable or disable command tracking for idempotent write operations.
     *
     * When tracking is enabled, write commands (SET VAR, INSTCMD) return
     * `OK TRACKING <uuid>` instead of `OK`. The UUID can be polled via
     * {@link getTracking} to check the command outcome.
     *
     * @param enabled - `true` to enable tracking, `false` to disable
     * @remarks Requires NUT 2.8.0+ (protocol v1.3) on the server.
     */
    async setTracking(enabled: boolean): ReturnType<RawNUTClient['setTracking']> {
        return this.#client.setTracking(enabled);
    }

    /**
     * Get the status of a previously tracked write command by its UUID.
     *
     * @param uuid - The tracking UUID returned by a write command
     * @returns `'PENDING'`, `'SUCCESS'`, or `'ERR'`
     * @remarks Requires NUT 2.8.0+ (protocol v1.3) on the server.
     */
    async getTracking(uuid: string): ReturnType<RawNUTClient['getTracking']> {
        return this.#client.getTracking(uuid);
    }

    /**
     * Parse a command response to detect tracking.
     * @param response - The raw response from the server
     * @returns CommandResult with tracking info
     */
    #parseCommandResponse(response: string): CommandResult {
        if (response.startsWith('OK TRACKING ')) {
            const trackingUid = response.slice('OK TRACKING '.length).trim();
            return { tracked: true, trackingUid };
        }
        return { tracked: false, success: true };
    }

    /**
     * Poll tracking status until completion or timeout.
     * @param trackingUid - The tracking UUID to poll
     * @param options - Polling options
     * @returns The final tracking status
     * @throws Error if timeout is reached
     */
    async #pollTracking(trackingUid: string, options?: TrackingOptions): Promise<'SUCCESS' | 'ERR'> {
        const timeout = options?.trackingTimeout ?? 30000;
        const pollInterval = options?.trackingPollInterval ?? 1000;
        const startTime = Date.now();

        while (true) {
            const status = await this.getTracking(trackingUid);

            if (status === 'SUCCESS') {
                return 'SUCCESS';
            }
            if (status === 'ERR') {
                return 'ERR';
            }

            if (status !== 'PENDING') {
                throw new Error(`Unexpected tracking status: ${status}`);
            }

            if (Date.now() - startTime >= timeout) {
                throw new Error(`Tracking timeout after ${timeout}ms for UUID: ${trackingUid}`);
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }

    /**
     * Destroy the client and release all resources.
     * After calling destroy(), the client cannot be reused.
     */
    destroy(): void {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;

        // Clear any pending reconnect timer
        if (this.#reconnectTimer) {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = undefined;
        }

        // Destroy the underlying RawNUTClient
        this.#client.destroy();

        // Emit destroyed before removing listeners so subscribers can react
        this.emit('destroyed');

        // Remove all event listeners from the EventEmitter
        this.removeAllListeners();

        // Clear stored credentials
        this.#username = undefined;
        this.#password = undefined;
    }
}
