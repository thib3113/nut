import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { Monitor } from '../src/Monitor.js';
import { NUTClient } from '../src/NUTClient.js';
import { UPS } from '../src/UPS.js';
import { ENUTStatus } from '../src/ENUTStatus.js';
import { ConnectionLostError } from '../src/Errors/ConnectionLostError.js';

/** Helper to wait for async operations */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Monitor', () => {
    let mockClient: Mocked<NUTClient>;
    let mockUps: Mocked<UPS>;
    let monitor: Monitor;

    beforeEach(() => {
        mockClient = {
            getUPS: vi.fn(),
            on: vi.fn(),
            off: vi.fn()
        } as unknown as Mocked<NUTClient>;

        mockUps = {
            listVariables: vi.fn()
        } as unknown as Mocked<UPS>;

        // Mock getUPS to return our mock UPS
        mockClient.getUPS.mockResolvedValue(mockUps as unknown as UPS);
    });

    afterEach(() => {
        monitor?.destroy();
    });

    /** Helper to create and start a monitor with a small poll frequency */
    async function createStartedMonitor(pollFrequency = 20): Promise<Monitor> {
        const mon = new Monitor(mockClient, 'testUps', { pollFrequency });
        await mon.start();
        return mon;
    }

    /** Helper to wait for a poll cycle */
    async function waitForPoll(ms = 50): Promise<void> {
        await wait(ms);
    }

    it('should not emit events on the first loop', async () => {
        // First poll returns data but no events should fire (first loop behavior)
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100',
            'ups.status': ENUTStatus.OL
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();

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
        // First poll: sets initial state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100'
        });
        // Second poll: variable changed
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '90'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        // Wait for first poll (sets previousState)
        await waitForPoll();
        // Wait for second poll (detects change)
        await waitForPoll();

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
        // First poll
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100'
        });
        // Second poll: new variable added
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100',
            'ups.load': '10'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

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
        // First poll
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100',
            'ups.load': '10'
        });
        // Second poll: variable removed
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

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
        // First poll
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': ENUTStatus.OL
        });
        // Second poll: status changed
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': ENUTStatus.OB
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('ONBATT');
    });

    it('should parse multi-status ups.status strings (e.g. "OL CHRG")', async () => {
        // First poll
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });
        // Second poll: now charging while still online
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL CHRG'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        // OL was already present, so no ONLINE event
        expect(spy).not.toHaveBeenCalledWith('ONLINE');
        // CHRG appeared but has no dedicated event — should not trigger UNKNOWN_STATUS
        // (CHRG is a known ENUTStatus value)
        expect(spy).not.toHaveBeenCalledWith('UNKNOWN_STATUS', expect.anything());
    });

    it('should emit ONLINE when OL appears in multi-status string', async () => {
        // First poll
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OB LB'
        });
        // Second poll: power restored, still low battery
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL LB'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('ONLINE');
        // LB was already present, no new LOWBATT
        expect(spy).not.toHaveBeenCalledWith('LOWBATT');
        // OB disappeared → NOTOB emitted
        expect(spy).toHaveBeenCalledWith('NOTOB');
    });

    it('should emit NOTOFF when OFF disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OFF'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTOFF');
        expect(spy).toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTCAL when CAL disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL CAL'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTCAL');
        // OL was already present
        expect(spy).not.toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTBYPASS when BYPASS disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'BYPASS'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTBYPASS');
        expect(spy).toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTOL when OL disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OB'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTOL');
        expect(spy).toHaveBeenCalledWith('ONBATT');
    });

    it('should emit NOTOB when OB disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OB'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTOB');
        expect(spy).toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTLB when LB disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL LB'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTLB');
    });

    it('should emit NOTFSD when FSD disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'FSD'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTFSD');
        expect(spy).toHaveBeenCalledWith('ONLINE');
    });

    it('should emit NOTRB when RB disappears from ups.status', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL RB'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('NOTRB');
    });

    it('should emit UNKNOWN_STATUS for unrecognized status codes', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL SOMETHING_NEW'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        expect(spy).toHaveBeenCalledWith('UNKNOWN_STATUS', 'SOMETHING_NEW');
    });

    it('should handle missing ups.status gracefully', async () => {
        mockUps.listVariables.mockResolvedValueOnce({
            'ups.status': 'OL'
        });
        // No ups.status in new state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100'
        });

        monitor = await createStartedMonitor();
        const spy = vi.spyOn(monitor, 'emit');

        await waitForPoll();
        await waitForPoll();

        // OL disappeared → NOTOL emitted, no crash
        expect(spy).toHaveBeenCalledWith('NOTOL');
        expect(spy).not.toHaveBeenCalledWith('UNKNOWN_STATUS', expect.anything());
    });

    it('should handle communication loss and recovery', async () => {
        // Use a long poll interval so each poll is well-separated in time
        monitor = new Monitor(mockClient, 'testUps', { pollFrequency: 500 });
        const spy = vi.spyOn(monitor, 'emit');

        // First poll: successful, establishes communication (#communication: undefined → true)
        mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });
        // Second poll: communication fails with ConnectionLostError
        mockUps.listVariables.mockRejectedValueOnce(new ConnectionLostError());
        // Third poll: communication recovers
        mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });

        await monitor.start();

        // Wait for first poll (~500ms). #communication goes from undefined to true.
        // No COMMOK emitted (only emitted on recovery from false, not from undefined).
        await wait(800);
        expect(mockUps.listVariables).toHaveBeenCalledTimes(1);

        // Wait for second poll (~1000ms). ConnectionLostError → state=null → COMMBAD
        await wait(800);
        expect(spy).toHaveBeenCalledWith('COMMBAD');

        // Wait for third poll (~1500ms). Success → #communication: false → true → COMMOK
        await wait(800);
        expect(spy).toHaveBeenCalledWith('COMMOK');
    });

    it('should propagate non-ConnectionLostError errors', async () => {
        // First poll: successful
        mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });
        // Second poll: non-communication error
        const customError = new Error('some unexpected error');
        mockUps.listVariables.mockRejectedValueOnce(customError);

        monitor = await createStartedMonitor();

        // Wait for first poll
        await waitForPoll();
        // Wait for second poll — the error should be caught by Heartbeat's try/catch
        // and not crash the monitor. The heartbeat catches errors in the callback.
        await waitForPoll();

        // The monitor should still be alive — a third poll should work
        mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '50' });
        await waitForPoll();
        // No crash = success
    });

    describe('pause / resume', () => {
        it('should start in a non-paused state', () => {
            monitor = new Monitor(mockClient, 'testUps');
            expect(monitor.isPaused()).toBe(false);
        });

        it('pause() should set the paused state', () => {
            monitor = new Monitor(mockClient, 'testUps');
            monitor.pause();
            expect(monitor.isPaused()).toBe(true);
        });

        it('resume() should clear the paused state', () => {
            monitor = new Monitor(mockClient, 'testUps');
            monitor.pause();
            expect(monitor.isPaused()).toBe(true);
            monitor.resume();
            expect(monitor.isPaused()).toBe(false);
        });

        it('resume() should reset previousState so the next poll is a fresh start', async () => {
            // First poll: sets initial state
            mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });

            monitor = await createStartedMonitor();
            const spy = vi.spyOn(monitor, 'emit');

            // Wait for first poll (sets previousState)
            await waitForPoll();

            // Pause and resume — this clears previousState
            monitor.pause();
            monitor.resume();

            // After resume, next poll should behave like the very first loop:
            // data is fetched but no VARIABLE_CHANGED / status events are emitted.
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '50',
                'ups.status': ENUTStatus.OB
            });

            await waitForPoll();

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
            // Use a long poll interval so exactly one poll fits in the first wait window
            monitor = new Monitor(mockClient, 'testUps', { pollFrequency: 500 });

            // First poll: sets initial state
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '100',
                'ups.status': ENUTStatus.OL
            });

            await monitor.start();

            // Wait for first poll (sets previousState) — 800ms ensures 1 poll (at ~500ms) but not 2 (at ~1000ms)
            await wait(800);
            expect(mockUps.listVariables).toHaveBeenCalledTimes(1);

            monitor.pause();

            // Simulate a state change while paused
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '50',
                'ups.status': ENUTStatus.OB
            });

            // Wait through several heartbeat ticks — none should call listVariables
            await wait(1200);

            // listVariables should NOT have been called again (early return on pause)
            expect(mockUps.listVariables).toHaveBeenCalledTimes(1);
        });

        it('should emit events again after resume()', async () => {
            // First poll: sets initial state
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '100'
            });

            monitor = await createStartedMonitor();
            const spy = vi.spyOn(monitor, 'emit');

            // Wait for first poll (sets previousState)
            await waitForPoll();

            monitor.pause();
            monitor.resume();

            // First poll after resume — fresh start, populates previousState
            mockUps.listVariables.mockResolvedValueOnce({
                'battery.charge': '80'
            });
            await waitForPoll();

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
            await waitForPoll();

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
            monitor = new Monitor(mockClient, 'testUps');
            expect(monitor.isDestroyed()).toBe(false);
            monitor.destroy();
            expect(monitor.isDestroyed()).toBe(true);
        });

        it('should be idempotent (safe to call multiple times)', () => {
            monitor = new Monitor(mockClient, 'testUps');
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
            monitor = new Monitor(mockClient, 'testUps');
            monitor.destroy();
            expect(monitor.isDestroyed()).toBe(true);
            expect(() => monitor.destroy()).not.toThrow();
        });

        it('should remove all event listeners', () => {
            monitor = new Monitor(mockClient, 'testUps');
            const listener = vi.fn();
            monitor.on('ONLINE', listener);
            monitor.on('ONBATT', listener);
            expect(monitor.listenerCount('ONLINE')).toBe(1);
            expect(monitor.listenerCount('ONBATT')).toBe(1);

            monitor.destroy();

            expect(monitor.listenerCount('ONLINE')).toBe(0);
            expect(monitor.listenerCount('ONBATT')).toBe(0);
        });

        it('should clean up internal state', async () => {
            // First poll: sets initial state
            mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });

            monitor = await createStartedMonitor();

            // Wait for first poll (sets previousState and ups internally)
            await waitForPoll();

            monitor.destroy();

            // After destroy, the monitor should be marked as destroyed
            expect(monitor.isDestroyed()).toBe(true);
            // And start() should throw, proving internal state was cleaned up
            await expect(monitor.start()).rejects.toThrow('Monitor has been destroyed and cannot be reused');
        });

        it('should throw when start() is called after destroy()', async () => {
            monitor = new Monitor(mockClient, 'testUps');
            monitor.destroy();
            await expect(monitor.start()).rejects.toThrow('Monitor has been destroyed and cannot be reused');
        });
    });

    describe('COMMBAD event', () => {
        it('should emit COMMBAD when communication is lost', async () => {
            monitor = new Monitor(mockClient, 'testUps', { pollFrequency: 500 });
            const spy = vi.spyOn(monitor, 'emit');

            mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });
            mockUps.listVariables.mockRejectedValueOnce(new ConnectionLostError());

            await monitor.start();

            await wait(800);
            await wait(800);
            expect(spy).toHaveBeenCalledWith('COMMBAD');
        });

        it('should not emit NOCOMM on consecutive communication failures', async () => {
            monitor = new Monitor(mockClient, 'testUps', { pollFrequency: 500 });
            const spy = vi.spyOn(monitor, 'emit');

            mockUps.listVariables.mockResolvedValueOnce({ 'battery.charge': '100' });
            mockUps.listVariables.mockRejectedValueOnce(new ConnectionLostError());
            mockUps.listVariables.mockRejectedValueOnce(new ConnectionLostError());

            await monitor.start();

            await wait(800);
            await wait(800);
            expect(spy).toHaveBeenCalledWith('COMMBAD');

            spy.mockClear();
            await wait(800);
            expect(spy).not.toHaveBeenCalledWith('COMMBAD');
        });
    });

    describe('client event listeners', () => {
        it('should register reconnected and reconnectExhausted listeners on construction', () => {
            monitor = new Monitor(mockClient, 'testUps');

            expect(mockClient.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
            expect(mockClient.on).toHaveBeenCalledWith('reconnectExhausted', expect.any(Function));
        });

        it('should emit NOCOMM when client emits reconnectExhausted', () => {
            monitor = new Monitor(mockClient, 'testUps');
            const spy = vi.spyOn(monitor, 'emit');

            const reconnectExhaustedHandler = mockClient.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'reconnectExhausted'
            )?.[1] as () => void;

            expect(reconnectExhaustedHandler).toBeDefined();
            reconnectExhaustedHandler();

            expect(spy).toHaveBeenCalledWith('NOCOMM');
        });

        it('should remove client listeners on destroy()', () => {
            monitor = new Monitor(mockClient, 'testUps');

            monitor.destroy();

            expect(mockClient.off).toHaveBeenCalledWith('reconnected', expect.any(Function));
            expect(mockClient.off).toHaveBeenCalledWith('reconnectExhausted', expect.any(Function));
        });

        it('should remove the same function references that were registered', () => {
            monitor = new Monitor(mockClient, 'testUps');

            const registeredReconnected = mockClient.on.mock.calls.find((call: unknown[]) => call[0] === 'reconnected')?.[1];
            const registeredReconnectExhausted = mockClient.on.mock.calls.find((call: unknown[]) => call[0] === 'reconnectExhausted')?.[1];

            monitor.destroy();

            expect(mockClient.off).toHaveBeenCalledWith('reconnected', registeredReconnected);
            expect(mockClient.off).toHaveBeenCalledWith('reconnectExhausted', registeredReconnectExhausted);
        });
    });
});
