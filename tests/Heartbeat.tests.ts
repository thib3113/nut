import { afterEach, describe, expect, it, vi } from 'vitest';
import { Heartbeat } from '../src/Heartbeat.js';

/** Small helper to wait for real-timer intervals. */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Heartbeat', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should call callback at each interval', async () => {
        const callback = vi.fn();
        const hb = new Heartbeat(30, callback);

        hb.start();

        expect(callback).not.toHaveBeenCalled();

        await wait(50);
        expect(callback).toHaveBeenCalledTimes(1);

        await wait(100);
        // After ~150ms total with 30ms interval, expect at least 3-4 calls
        expect(callback.mock.calls.length).toBeGreaterThanOrEqual(3);

        hb.stop();
    });

    it('should not create two timers if start() is called twice', async () => {
        const callback = vi.fn();
        const hb = new Heartbeat(30, callback);

        hb.start();
        hb.start(); // second call should be a no-op

        await wait(50);
        // Only one internal loop should be running — one interval tick
        // should trigger the callback exactly once.
        expect(callback).toHaveBeenCalledTimes(1);
        hb.stop();
    });

    it('should stop the timer when stop() is called', async () => {
        const callback = vi.fn();
        const hb = new Heartbeat(30, callback);

        hb.start();

        await wait(80);
        const countAfterStart = callback.mock.calls.length;
        expect(countAfterStart).toBeGreaterThanOrEqual(2);

        hb.stop();

        await wait(100);
        // No more calls after stop
        expect(callback).toHaveBeenCalledTimes(countAfterStart);
    });

    it('should catch errors thrown by the callback', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        let callCount = 0;
        const callback = vi.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
                throw new Error('callback boom');
            }
        });

        const hb = new Heartbeat(30, callback);
        hb.start();

        await wait(50);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Heartbeat callback crashed', expect.any(Error));

        // Heartbeat should still be alive — next tick should call callback again
        await wait(100);
        // After error, callback should continue being called
        expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2);

        hb.stop();
        consoleErrorSpy.mockRestore();
    });

    it('should be safe to call stop() multiple times', async () => {
        const callback = vi.fn();
        const hb = new Heartbeat(30, callback);

        hb.start();
        hb.stop();
        expect(() => hb.stop()).not.toThrow();
    });

    it('should be safe to call stop() without start()', () => {
        const callback = vi.fn();
        const hb = new Heartbeat(30, callback);

        expect(() => hb.stop()).not.toThrow();
    });

    it('should work with async callbacks', async () => {
        const results: number[] = [];
        const callback = vi.fn().mockImplementation(async () => {
            await wait(5);
            results.push(Date.now());
        });

        const hb = new Heartbeat(30, callback);
        hb.start();

        await wait(110);
        hb.stop();

        // Should have been called at least 2-3 times
        expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should work with synchronous callbacks', async () => {
        const callback = vi.fn();
        const hb = new Heartbeat(30, callback);

        hb.start();
        await wait(80);
        hb.stop();

        expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
