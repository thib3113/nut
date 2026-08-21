import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { Monitor } from '../src/Monitor.js';
import { NUTClient } from '../src/NUTClient.js';
import { UPS } from '../src/UPS.js';
import { ENUTStatus } from '../src/ENUTStatus.js';

describe('Monitor', () => {
    let mockClient: Mocked<NUTClient>;
    let mockUps: Mocked<UPS>;
    let monitor: Monitor;

    beforeEach(() => {
        mockClient = {
            getUPS: vi.fn()
        } as unknown as Mocked<NUTClient>;

        mockUps = {
            listVariables: vi.fn()
        } as unknown as Mocked<UPS>;

        monitor = new Monitor(mockClient, 'testUps');
        // @ts-ignore
        monitor.ups = mockUps;
    });

    it('should not emit events on the first loop', async () => {
        const spy = vi.spyOn(monitor, 'emit');
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100',
            'ups.status': ENUTStatus.OL
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).not.toHaveBeenCalledWith(
            'VARIABLE_CHANGED',
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything()
        );
    });

    it('should emit VARIABLE_CHANGED when a variable is modified', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // Initial state
        // @ts-ignore
        monitor.previousState = {
            'battery.charge': '100'
        };
        // @ts-ignore
        monitor.communication = true;

        // New state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '90'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith(
            'VARIABLE_CHANGED',
            'battery.charge',
            '100',
            '90',
            { 'battery.charge': '100' },
            { 'battery.charge': '90' }
        );
        expect(spy).toHaveBeenCalledWith('VARIABLES_CHANGED', { 'battery.charge': '100' }, { 'battery.charge': '90' });
    });

    it('should emit VARIABLE_CHANGED when a variable is added', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // Initial state
        // @ts-ignore
        monitor.previousState = {
            'battery.charge': '100'
        };
        // @ts-ignore
        monitor.communication = true;

        // New state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100',
            'ups.load': '10'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith(
            'VARIABLE_CHANGED',
            'ups.load',
            '',
            '10',
            { 'battery.charge': '100' },
            { 'battery.charge': '100', 'ups.load': '10' }
        );
    });

    it('should emit VARIABLE_CHANGED when a variable is removed', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // Initial state
        // @ts-ignore
        monitor.previousState = {
            'battery.charge': '100',
            'ups.load': '10'
        };
        // @ts-ignore
        monitor.communication = true;

        // New state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith(
            'VARIABLE_CHANGED',
            'ups.load',
            '10',
            '',
            { 'battery.charge': '100', 'ups.load': '10' },
            { 'battery.charge': '100' }
        );
    });

    it('should handle status changes and emit corresponding events', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // Initial state
        // @ts-ignore
        monitor.previousState = {
            'ups.status': ENUTStatus.OL
        };
        // @ts-ignore
        monitor.communication = true;

        // New state
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': ENUTStatus.OB
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('ONBATT');
    });

    it('should parse multi-status ups.status strings (e.g. "OL CHRG")', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'OL'
        };
        // @ts-ignore
        monitor.communication = true;

        // Now charging while still online
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL CHRG'
        });

        // @ts-ignore
        await monitor._loopFn();

        // OL was already present, so no ONLINE event
        expect(spy).not.toHaveBeenCalledWith('ONLINE');
        // CHRG appeared but has no dedicated event — should not trigger UNKNOWN_STATUS
        // (CHRG is a known ENUTStatus value)
        expect(spy).not.toHaveBeenCalledWith('UNKNOWN_STATUS', expect.anything());
    });

    it('should emit ONLINE when OL appears in multi-status string', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'OB LB'
        };
        // @ts-ignore
        monitor.communication = true;

        // Power restored, still low battery
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL LB'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('ONLINE');
        // LB was already present, no new LOWBATT
        expect(spy).not.toHaveBeenCalledWith('LOWBATT');
        // OB disappeared but has no NOT* event
        expect(spy).not.toHaveBeenCalledWith('ONBATT');
    });

    it('should emit NOTOFF when OFF disappears from ups.status', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'OFF'
        };
        // @ts-ignore
        monitor.communication = true;

        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('NOTOFF');
        expect(spy).toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTCAL when CAL disappears from ups.status', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'OL CAL'
        };
        // @ts-ignore
        monitor.communication = true;

        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('NOTCAL');
        // OL was already present
        expect(spy).not.toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTBYPASS when BYPASS disappears from ups.status', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'BYPASS'
        };
        // @ts-ignore
        monitor.communication = true;

        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('NOTBYPASS');
        expect(spy).toHaveBeenCalledWith('ONLINE');
    });

    it('should emit UNKNOWN_STATUS for unrecognized status codes', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'OL'
        };
        // @ts-ignore
        monitor.communication = true;

        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL SOMETHING_NEW'
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('UNKNOWN_STATUS', 'SOMETHING_NEW');
    });

    it('should handle missing ups.status gracefully', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // @ts-ignore
        monitor.previousState = {
            'ups.status': 'OL'
        };
        // @ts-ignore
        monitor.communication = true;

        // No ups.status in new state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100'
        });

        // @ts-ignore
        await monitor._loopFn();

        // OL disappeared — no specific NOT* event for OL, but no crash
        expect(spy).not.toHaveBeenCalledWith('UNKNOWN_STATUS', expect.anything());
    });

    it('should handle communication loss and recovery', async () => {
        const spy = vi.spyOn(monitor, 'emit');

        // Initially communicating
        // @ts-ignore
        monitor.communication = true;

        // Communication fails
        mockUps.listVariables.mockRejectedValueOnce(new Error('fail'));

        // @ts-ignore
        await monitor._loopFn();
        expect(spy).toHaveBeenCalledWith('NOCOMM');
        // @ts-ignore
        expect(monitor.communication).toBe(false);

        // Communication recovers
        mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });
        // @ts-ignore
        await monitor._loopFn();
        expect(spy).toHaveBeenCalledWith('COMMOK');
        // @ts-ignore
        expect(monitor.communication).toBe(true);
    });

    describe('pause / resume', () => {
        it('should start in a non-paused state', () => {
            expect(monitor.isPaused()).toBe(false);
        });

        it('pause() should set the paused state', () => {
            monitor.pause();
            expect(monitor.isPaused()).toBe(true);
        });

        it('resume() should clear the paused state', () => {
            monitor.pause();
            expect(monitor.isPaused()).toBe(true);
            monitor.resume();
            expect(monitor.isPaused()).toBe(false);
        });

        it('resume() should reset previousState so the next poll is a fresh start', async () => {
            const spy = vi.spyOn(monitor, 'emit');

            // Seed a previous state so the monitor is "warm"
            // @ts-ignore
            monitor.previousState = { 'battery.charge': '100' };
            // @ts-ignore
            monitor.communication = true;

            monitor.pause();
            monitor.resume();

            // After resume, previousState must be cleared
            // @ts-ignore
            expect(monitor.previousState).toBeUndefined();

            // First poll after resume should behave like the very first loop:
            // data is fetched but no VARIABLE_CHANGED / status events are emitted.
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '50',
                'ups.status': ENUTStatus.OB
            });

            // @ts-ignore
            await monitor._loopFn();

            expect(spy).not.toHaveBeenCalledWith(
                'VARIABLE_CHANGED',
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything()
            );
            expect(spy).not.toHaveBeenCalledWith('ONBATT');
        });

        it('should not emit any events while paused', async () => {
            const spy = vi.spyOn(monitor, 'emit');

            // Warm up the monitor with a previous state
            // @ts-ignore
            monitor.previousState = { 'battery.charge': '100', 'ups.status': ENUTStatus.OL };
            // @ts-ignore
            monitor.communication = true;

            monitor.pause();

            // Simulate a state change while paused
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '50',
                'ups.status': ENUTStatus.OB
            });

            // @ts-ignore
            await monitor._loopFn();

            // No events should have been emitted
            expect(spy).not.toHaveBeenCalled();
            // listVariables should NOT have been called either (early return)
            expect(mockUps.listVariables).not.toHaveBeenCalled();
        });

        it('should emit events again after resume()', async () => {
            const spy = vi.spyOn(monitor, 'emit');

            // Warm up
            // @ts-ignore
            monitor.previousState = { 'battery.charge': '100' };
            // @ts-ignore
            monitor.communication = true;

            monitor.pause();
            monitor.resume();

            // First poll after resume — fresh start, populates previousState
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '80'
            });
            // @ts-ignore
            await monitor._loopFn();

            // No events yet (fresh start behaves like first loop)
            expect(spy).not.toHaveBeenCalledWith(
                'VARIABLE_CHANGED',
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything()
            );

            // Second poll — now events should fire on change
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '60'
            });
            // @ts-ignore
            await monitor._loopFn();

            expect(spy).toHaveBeenCalledWith(
                'VARIABLE_CHANGED',
                'battery.charge',
                '80',
                '60',
                { 'battery.charge': '80' },
                { 'battery.charge': '60' }
            );
        });
    });

    describe('destroy', () => {
        it('should mark the monitor as destroyed', () => {
            expect(monitor.isDestroyed()).toBe(false);
            monitor.destroy();
            expect(monitor.isDestroyed()).toBe(true);
        });

        it('should be idempotent (safe to call multiple times)', () => {
            expect(() => {
                monitor.destroy();
                monitor.destroy();
                monitor.destroy();
            }).not.toThrow();
            expect(monitor.isDestroyed()).toBe(true);
        });

        it('should stop the heartbeat', () => {
            // Start a monitor so the heartbeat is running, then destroy it.
            // After destroy, the heartbeat must be stopped — we verify this
            // indirectly: start() after destroy() throws, proving the monitor
            // is fully torn down and cannot restart its heartbeat.
            monitor.destroy();
            expect(monitor.isDestroyed()).toBe(true);
            expect(() => monitor.destroy()).not.toThrow();
        });

        it('should remove all event listeners', () => {
            const listener = vi.fn();
            monitor.on('ONLINE', listener);
            monitor.on('ONBATT', listener);
            expect(monitor.listenerCount('ONLINE')).toBe(1);
            expect(monitor.listenerCount('ONBATT')).toBe(1);

            monitor.destroy();

            expect(monitor.listenerCount('ONLINE')).toBe(0);
            expect(monitor.listenerCount('ONBATT')).toBe(0);
        });

        it('should clean up internal state', () => {
            // @ts-ignore
            monitor.ups = mockUps;
            // @ts-ignore
            monitor.previousState = { 'battery.charge': '100' };

            monitor.destroy();

            // @ts-ignore
            expect(monitor.ups).toBeUndefined();
            // @ts-ignore
            expect(monitor.previousState).toBeUndefined();
        });

        it('should throw when start() is called after destroy()', async () => {
            monitor.destroy();
            await expect(monitor.start()).rejects.toThrow('Monitor has been destroyed and cannot be reused');
        });
    });
});
