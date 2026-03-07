import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Monitor } from '../src/Monitor.js';
import { NUTClient } from '../src/NUTClient.js';
import { UPS } from '../src/UPS.js';
import { ENUTStatus } from '../src/ENUTStatus.js';

describe('Monitor', () => {
    let mockClient: jest.Mocked<NUTClient>;
    let mockUps: jest.Mocked<UPS>;
    let monitor: Monitor;

    beforeEach(() => {
        mockClient = {
            getUPS: jest.fn()
        } as unknown as jest.Mocked<NUTClient>;

        mockUps = {
            listVariables: jest.fn()
        } as unknown as jest.Mocked<UPS>;

        monitor = new Monitor(mockClient, 'testUps');
        // @ts-ignore
        monitor.ups = mockUps;
    });

    it('should not emit events on the first loop', async () => {
        const spy = jest.spyOn(monitor, 'emit');
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.charge': '100',
            'battery.status': ENUTStatus.OL
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).not.toHaveBeenCalledWith('VARIABLE_CHANGED', expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything());
    });

    it('should emit VARIABLE_CHANGED when a variable is modified', async () => {
        const spy = jest.spyOn(monitor, 'emit');

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
        const spy = jest.spyOn(monitor, 'emit');

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
        const spy = jest.spyOn(monitor, 'emit');

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
        const spy = jest.spyOn(monitor, 'emit');

        // Initial state
        // @ts-ignore
        monitor.previousState = {
            'battery.status': ENUTStatus.OL
        };
        // @ts-ignore
        monitor.communication = true;

        // New state
        mockUps.listVariables.mockResolvedValueOnce({
            'battery.status': ENUTStatus.OB
        });

        // @ts-ignore
        await monitor._loopFn();

        expect(spy).toHaveBeenCalledWith('ONBATT');
    });

    it('should handle communication loss and recovery', async () => {
        const spy = jest.spyOn(monitor, 'emit');

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
});
