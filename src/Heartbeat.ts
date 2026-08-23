import { setInterval } from 'node:timers/promises';
import { createDebugger } from './utils.internal.js';

const debug = createDebugger('Heartbeat');

export class Heartbeat {
    #timer?: AsyncIterable<null>;
    #controller?: AbortController;
    #interval: number;
    #callback: () => Promise<void> | void;

    constructor(interval: number, callback: () => Promise<void> | void) {
        this.#interval = interval;
        this.#callback = callback;
    }

    start() {
        if (this.#timer) {
            return;
        }

        this.#controller = new AbortController();

        this.#timer = setInterval(this.#interval, null, {
            signal: this.#controller.signal
        });

        this.loop().catch((err: Error) => debug('Heartbeat loop crashed: %O', err));
    }

    async loop() {
        if (!this.#timer) {
            throw new Error('Heartbeat timer not initialized');
        }

        for await (const _ of this.#timer) {
            try {
                await this.#callback();
            } catch (e) {
                debug('Heartbeat callback crashed: %O', e);
            }
        }
    }

    stop() {
        if (this.#timer) {
            this.#controller?.abort('stopped');
            this.#timer = undefined;
        }
    }
}
