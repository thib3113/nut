import { NUTClient } from './NUTClient.js';
import { UPSName } from './RawNUTClient.js';
import { Heartbeat } from './Heartbeat.js';
import { UPS } from './UPS.js';
import { ENUTStatus } from './ENUTStatus.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { createDebugger } from './utils.internal.js';
import { nutVariables, nutVariablesNames } from './NUTVariables.js';

export interface IMonitorOptions {
    pollFrequency?: number;
}

interface IMonitorEvents {
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
     * The UPS can’t be contacted for monitoring.
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
     * @param charge {number} the current charge of the UPS (can be NaN)
     * @param rawCharge {string} the raw value of charge (in case of NaN)
     */
    BATTERY_CHARGE: (charge: number, rawCharge: string) => void;
    /**
     * RUNTIME of the battery
     * @param charge {number} the current charge of the UPS (can be NaN)
     * @param rawCharge {string} the raw value of charge (in case of NaN)
     */
    BATTERY_RUNTIME: (charge: number, rawCharge: string) => void;
    /**
     * get a variable change
     * @param key {string} the key
     * @param oldValue {string} the old value of the variable
     * @param newValue {string} the new value of the variable
     * @param oldVariables {string} the old variables
     * @param newVariables {string} the new variables
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
export class Monitor extends TypedEmitter<IMonitorEvents> {
    private options: Required<IMonitorOptions>;

    private communication?: boolean;
    private previousState?: nutVariables;
    private heartBeat: Heartbeat;
    private ups?: UPS;

    constructor(
        private readonly client: NUTClient,
        private readonly upsName: UPSName,
        options: IMonitorOptions = {}
    ) {
        super();

        this.options = {
            ...defaultOptions,
            ...options
        };

        this.heartBeat = new Heartbeat(this.options.pollFrequency, this._loopFn);
    }

    async start(): Promise<void> {
        const ups = await this.client.getUPS(this.upsName);
        if (!ups) {
            throw new Error(`fail to get UPS`);
        }

        this.ups = ups;

        this.heartBeat.start();
    }

    async stop(): Promise<void> {
        this.heartBeat.stop();
    }

    private _loopFn = async () => {
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

        const batteryStatus = state['battery.status'] as ENUTStatus;
        const previousBatteryStatus = previousState['battery.status'] as ENUTStatus;

        if (batteryStatus !== previousBatteryStatus) {
            switch (batteryStatus) {
                case ENUTStatus.OL:
                    this.emit('ONLINE');
                    break;
                case ENUTStatus.OB:
                    this.emit('ONBATT');
                    break;
                case ENUTStatus.RB:
                    this.emit('REPLBATT');
                    break;
                case ENUTStatus.LB:
                    this.emit('LOWBATT');
                    break;
                case ENUTStatus.FSD:
                    this.emit('FSD');
                    break;
                case ENUTStatus.CAL:
                    this.emit('CAL');
                    break;
                case ENUTStatus.OFF:
                    this.emit('OFF');
                    break;
                case ENUTStatus.BYPASS:
                    this.emit('BYPASS');
                    break;
                default:
                    this.emit('UNKNOWN_STATUS', batteryStatus);
            }

            if (previousBatteryStatus === ENUTStatus.OFF) {
                this.emit('NOTOFF');
            }
            if (previousBatteryStatus === ENUTStatus.CAL) {
                this.emit('NOTCAL');
            }
            if (previousBatteryStatus === ENUTStatus.BYPASS) {
                this.emit('NOTBYPASS');
            }
        }

        this.checkChangedValue(previousState, state, 'battery.charge', (value) => this.emit('BATTERY_CHARGE', Number(value), value));
        this.checkChangedValue(previousState, state, 'battery.runtime', (value) => this.emit('BATTERY_RUNTIME', Number(value), value));

        let variableChanged = false;
        Object.keys({
            ...previousState,
            ...state
        }).map((k) => {
            const key = k as nutVariablesNames;
            return this.checkChangedValue(previousState, state, key, () => {
                this.emit('VARIABLE_CHANGED', key, previousState[key], state[key], previousState, state);
                variableChanged = true;
            });
        });

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
