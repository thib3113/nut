import { NUTClient } from './NUTClient.js';
import { UPSName } from './RawNUTClient.js';
import { Heartbeat } from './Heartbeat.js';
import { UPS } from './UPS.js';
import { ENUTStatus } from './ENUTStatus.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { createDebugger } from './utils.internal.js';
import { nutVariables, nutVariablesNames } from './NUTVariables.js';

export interface IMonitorOptions {
    /**
     * Time between two checks (ms)
     * @default 60000 (1m)
     */
    pollFrequency?: number;
}

export interface IMonitorEvents {
    /**
     * The UPS is back online.
     */
    ONLINE: () => void;
    /**
     * The UPS is on battery.
     */
    ONBATT: () => void;
    /**
     * The UPS battery is low (as determined by the driver).
     */
    LOWBATT: () => void;
    /**
     * The UPS has been commanded into the "forced shutdown" mode.
     */
    FSD: () => void;
    /**
     * Communication with the UPS has been established.
     */
    COMMOK: () => void;
    /**
     * Communication with the UPS was just lost.
     */
    COMMBAD: () => void;
    /**
     * The local system is being shut down.
     */
    SHUTDOWN: () => void;
    /**
     * The UPS needs to have its battery replaced.
     */
    REPLBATT: () => void;
    /**
     * The UPS can't be contacted for monitoring.
     */
    NOCOMM: () => void;
    /**
     * UPS calibration in progress.
     */
    CAL: () => void;
    /**
     * UPS calibration finished.
     */
    NOTCAL: () => void;
    /**
     * UPS administratively OFF or asleep.
     */
    OFF: () => void;
    /**
     * UPS no longer administratively OFF or asleep.
     */
    NOTOFF: () => void;
    /**
     * UPS on bypass (powered, not protecting).
     */
    BYPASS: () => void;
    /**
     * UPS no longer on bypass.
     */
    NOTBYPASS: () => void;
    /**
     * UPS STATUS IS UNKNOWN
     */
    UNKNOWN_STATUS: (status: string) => void;
    /**
     * CHARGE of the battery
     * @param charge the current charge of the UPS (can be NaN)
     * @param rawCharge the raw value of charge (in case of NaN)
     */
    BATTERY_CHARGE: (charge: number, rawCharge: string) => void;
    /**
     * RUNTIME of the battery
     * @param charge the current charge of the UPS (can be NaN)
     * @param rawCharge the raw value of charge (in case of NaN)
     */
    BATTERY_RUNTIME: (charge: number, rawCharge: string) => void;
    /**
     * get a variable change
     * @param key the key
     * @param oldValue the old value of the variable
     * @param newValue the new value of the variable
     * @param oldVariables the old variables
     * @param newVariables the new variables
     */
    VARIABLE_CHANGED: (
        key: nutVariablesNames,
        oldValue: string,
        newValue: string,
        oldVariables: nutVariables,
        newVariables: nutVariables
    ) => void;
    /**
     * get all variables update
     * @param oldVariables {string} the old variables
     * @param newVariables {string} the new variables
     */
    VARIABLES_CHANGED: (oldVariables: nutVariables, newVariables: nutVariables) => void;
    /**
     * allow to listen to all events
     * @param event
     * @param args
     */
    '*': (event: string, ...args: any[]) => void;
}

const defaultOptions: Required<IMonitorOptions> = {
    pollFrequency: 60 * 1000
};

const debug = createDebugger('Monitor');

/**
 * Allow to monitor events on the UPS
 *
 * @example
 * ```ts
 * const client = new NUTClient('127.0.0.1', 3493);
 * const monitor = new Monitor(client, 'myUps');
 * monitor.on('ONBATT', () => {
 *   console.log('UPS "myUps" lost power and is now on battery');
 * });
 * await monitor.start()
 * ```
 */
export class Monitor extends TypedEmitter<IMonitorEvents> {
    #options: Required<IMonitorOptions>;
    #heartBeat: Heartbeat;
    #client: NUTClient;
    #upsName: UPSName;
    #destroyed = false;

    // Kept as TypeScript `private` (not `#`) because tests directly access these fields
    private communication?: boolean;
    private previousState?: nutVariables;
    private ups?: UPS;
    private _paused = false;

    constructor(client: NUTClient, upsName: UPSName, options: IMonitorOptions = {}) {
        super();

        this.#client = client;
        this.#upsName = upsName;

        this.#options = {
            ...defaultOptions,
            ...options
        };

        this.#heartBeat = new Heartbeat(this.#options.pollFrequency, this._loopFn);
    }

    async start(): Promise<void> {
        if (this.#destroyed) {
            throw new Error('Monitor has been destroyed and cannot be reused');
        }

        const ups = await this.#client.getUPS(this.#upsName);
        if (!ups) {
            throw new Error(`fail to get UPS`);
        }

        this.ups = ups;

        this.#heartBeat.start();
    }

    stop(): void {
        this.#heartBeat.stop();
    }

    /**
     * Destroy the monitor and release all resources.
     * After calling destroy(), the monitor cannot be reused.
     *
     * - Stops the heartbeat
     * - Removes all event listeners
     * - Cleans up internal state
     *
     * Safe to call multiple times (idempotent).
     */
    destroy(): void {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        this.#heartBeat.stop();
        this.removeAllListeners();

        // Clean up references
        this.ups = undefined;
        this.previousState = undefined;
    }

    /**
     * Check if the monitor has been destroyed.
     */
    isDestroyed(): boolean {
        return this.#destroyed;
    }

    /**
     * Pause monitoring without stopping it.
     * The heartbeat loop keeps running but events are not emitted while paused.
     * When resumed, the next poll is treated as a fresh start (no spurious events).
     */
    pause(): void {
        this._paused = true;
        debug('monitoring paused');
    }

    /**
     * Resume monitoring after a pause.
     * `previousState` is cleared so the next poll behaves like the first loop
     * (no VARIABLE_CHANGED / status events are emitted for stale data).
     */
    resume(): void {
        this._paused = false;
        this.previousState = undefined;
        debug('monitoring resumed');
    }

    /**
     * Check if monitoring is currently paused.
     */
    isPaused(): boolean {
        return this._paused;
    }

    private readonly _loopFn = async () => {
        if (this._paused) {
            return;
        }

        if (!this.ups) {
            throw new Error('ups need to be setup before');
        }

        const previousState = this.previousState;
        const state = await this.ups.listVariables().catch((e) => {
            debug.extend('loop')('fail to get state : %o', e);
            return null;
        });

        // state is null => error in communication
        if (state === null) {
            if (this.communication) {
                this.communication = false;
                this.emit('NOCOMM');
            }
            return;
        }

        if (this.communication === false) {
            this.communication = true;
            this.emit('COMMOK');
        }

        this.previousState = state;

        // no emit on first loop
        if (!previousState) {
            return;
        }

        // ups.status contains space-separated status codes (e.g. "OL CHRG")
        const rawStatus = (state['ups.status'] ?? '') as string;
        const currentStatuses = new Set(rawStatus.split(/\s+/).filter(Boolean));

        const rawPreviousStatus = (previousState['ups.status'] ?? '') as string;
        const previousStatuses = new Set(rawPreviousStatus.split(/\s+/).filter(Boolean));

        // Emit events when a status code appears
        if (!previousStatuses.has(ENUTStatus.OL) && currentStatuses.has(ENUTStatus.OL)) {
            this.emit('ONLINE');
        }
        if (!previousStatuses.has(ENUTStatus.OB) && currentStatuses.has(ENUTStatus.OB)) {
            this.emit('ONBATT');
        }
        if (!previousStatuses.has(ENUTStatus.LB) && currentStatuses.has(ENUTStatus.LB)) {
            this.emit('LOWBATT');
        }
        if (!previousStatuses.has(ENUTStatus.FSD) && currentStatuses.has(ENUTStatus.FSD)) {
            this.emit('FSD');
        }
        if (!previousStatuses.has(ENUTStatus.RB) && currentStatuses.has(ENUTStatus.RB)) {
            this.emit('REPLBATT');
        }
        if (!previousStatuses.has(ENUTStatus.CAL) && currentStatuses.has(ENUTStatus.CAL)) {
            this.emit('CAL');
        }
        if (!previousStatuses.has(ENUTStatus.OFF) && currentStatuses.has(ENUTStatus.OFF)) {
            this.emit('OFF');
        }
        if (!previousStatuses.has(ENUTStatus.BYPASS) && currentStatuses.has(ENUTStatus.BYPASS)) {
            this.emit('BYPASS');
        }

        // Emit events when a status code disappears
        if (previousStatuses.has(ENUTStatus.OFF) && !currentStatuses.has(ENUTStatus.OFF)) {
            this.emit('NOTOFF');
        }
        if (previousStatuses.has(ENUTStatus.CAL) && !currentStatuses.has(ENUTStatus.CAL)) {
            this.emit('NOTCAL');
        }
        if (previousStatuses.has(ENUTStatus.BYPASS) && !currentStatuses.has(ENUTStatus.BYPASS)) {
            this.emit('NOTBYPASS');
        }

        // Emit UNKNOWN_STATUS for any unrecognized status codes
        const knownStatuses = new Set<string>(Object.values(ENUTStatus));
        for (const status of currentStatuses) {
            if (!knownStatuses.has(status)) {
                this.emit('UNKNOWN_STATUS', status);
            }
        }

        this.checkChangedValue(previousState, state, 'battery.charge', (value) => this.emit('BATTERY_CHARGE', Number(value), value));
        this.checkChangedValue(previousState, state, 'battery.runtime', (value) => this.emit('BATTERY_RUNTIME', Number(value), value));

        let variableChanged = false;
        const processKey = (k: string) => {
            const key = k as nutVariablesNames;
            this.checkChangedValue(previousState, state, key, () => {
                this.emit('VARIABLE_CHANGED', key, previousState[key] ?? '', state[key] ?? '', previousState, state);
                variableChanged = true;
            });
        };

        for (const key of Object.keys(state)) {
            processKey(key);
        }
        for (const key of Object.keys(previousState)) {
            if (!(key in state)) {
                processKey(key);
            }
        }

        // one variable changed ?
        if (variableChanged) {
            this.emit('VARIABLES_CHANGED', previousState, state);
        }
    };

    public emit<U extends keyof IMonitorEvents>(event: U, ...args: Parameters<IMonitorEvents[U]>): boolean {
        debug('emit event %s', event);
        super.emit('*', event, ...args);
        return super.emit(event, ...args);
    }

    private checkChangedValue(
        previous: nutVariables,
        value: nutVariables,
        key: nutVariablesNames,
        onChanged: (value: string) => any
    ): void {
        if (previous[key] !== value[key]) {
            onChanged(value[key] ?? '');
        }
    }
}
