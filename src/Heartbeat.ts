import { setInterval } from 'node:timers/promises';

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

        this.loop().catch((err: Error) => console.error('Heartbeat loop crashed', err));
    }

    async loop() {
        if (!this.#timer) {
            throw new Error('something is wrong');
        }

        for await (const _ of this.#timer) {
            try {
                await this.#callback();
            } catch (e) {
                console.error('Heartbeat callback crashed', e);
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
