export interface DataContainer<T> {
    data: T;
    priority: number;
}

export interface AsyncResultCallback<T, E = Error> {
    (err?: E | null, result?: T): void;
}

export interface QueueObject<T> {
    /**
     * Returns the number of items waiting to be processed.
     */
    length(): number;

    /**
     * Indicates whether or not any items have been pushed and processed by the queue.
     */
    started: boolean;

    /**
     * Returns the number of items currently being processed.
     */
    running(): number;

    /**
     * Returns an array of items currently being processed.
     */
    workersList<TWorker extends DataContainer<T>, CallbackContainer>(): TWorker[];

    /**
     * Returns false if there are items waiting or being processed, or true if not.
     */
    idle(): boolean;

    /**
     * An integer for determining how many worker functions should be run in parallel.
     * This property can be changed after a queue is created to alter the concurrency on-the-fly.
     */
    concurrency: number;

    /**
     * An integer that specifies how many items are passed to the worker function at a time.
     * Only applies if this is a cargo object
     */
    payload: number;

    /**
     * Add a new task to the queue. Calls `callback` once the worker has finished
     * processing the task.
     *
     * Instead of a single task, a tasks array can be submitted.
     * The respective callback is used for every task in the list.
     */
    push<R>(task: T | T[]): Promise<R>;
    push<R, E = Error>(task: T | T[], callback: AsyncResultCallback<R, E>): void;

    /**
     * Add a new task to the front of the queue
     */
    unshift<R>(task: T | T[]): Promise<R>;
    unshift<R, E = Error>(task: T | T[], callback: AsyncResultCallback<R, E>): void;

    /**
     * The same as `q.push`, except this returns a promise that rejects if an error occurs.
     * The `callback` arg is ignored
     */
    pushAsync<R>(task: T | T[]): Promise<R>;

    /**
     * The same as `q.unshift`, except this returns a promise that rejects if an error occurs.
     * The `callback` arg is ignored
     */
    unshiftAsync<R>(task: T | T[]): Promise<R>;

    /**
     * Remove items from the queue that match a test function.
     * The test function will be passed an object with a `data` property,
     * and a `priority` property, if this is a `priorityQueue` object.
     */
    remove(filter: (node: DataContainer<T>) => boolean): void;

    /**
     * A function that sets a callback that is called when the number of
     * running workers hits the `concurrency` limit, and further tasks will be
     * queued.
     *
     * If the callback is omitted, `q.saturated()` returns a promise
     * for the next occurrence.
     */
    saturated(): Promise<void>;
    saturated(handler: () => void): void;

    /**
     * A function that sets a callback that is called when the number
     * of running workers is less than the `concurrency` & `buffer` limits,
     * and further tasks will not be queued
     *
     * If the callback is omitted, `q.unsaturated()` returns a promise
     * for the next occurrence.
     */
    unsaturated(): Promise<void>;
    unsaturated(handler: () => void): void;

    /**
     * A minimum threshold buffer in order to say that the `queue` is `unsaturated`.
     */
    buffer: number;

    /**
     * A function that sets a callback that is called when the last item from the `queue`
     * is given to a `worker`.
     *
     * If the callback is omitted, `q.empty()` returns a promise for the next occurrence.
     */
    empty(): Promise<void>;
    empty(handler: () => void): void;

    /**
     * A function that sets a callback that is called when the last item from
     * the `queue` has returned from the `worker`.
     *
     * If the callback is omitted, `q.drain()` returns a promise for the next occurrence.
     */
    drain(): Promise<void>;
    drain(handler: () => void): void;

    /**
     * A function that sets a callback that is called when a task errors.
     *
     * If the callback is omitted, `q.error()` returns a promise that rejects on the next error.
     */
    error(): Promise<never>;
    error(handler: (error: Error, task: T) => void): void;

    /**
     * A boolean for determining whether the queue is in a paused state.
     */
    paused: boolean;

    /**
     * A function that pauses the processing of tasks until `q.resume()` is called.
     */
    pause(): void;

    /**
     * A function that resumes the processing of queued tasks when the queue
     * is paused.
     */
    resume(): void;

    /**
     * A function that removes the drain callback and empties remaining tasks
     * from the queue forcing it to go idle. No more tasks should be pushed to
     * the queue after calling this function.
     */
    kill(): void;
}
