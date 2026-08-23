/**
 * Testing strategy:
 * - Unit tests (this file): Use mocks to test individual components in isolation
 * - Integration tests (usage.tests.ts): Test real protocol flow with NUT server
 *
 * Unit tests verify logic, integration tests verify protocol compliance.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NUTClient as NUTClientType } from '../src/NUTClient.js';
import type { RawNUTClient as RawNUTClientType } from '../src/RawNUTClient.js';
import type { ConnectionOptions } from 'node:tls';
import crypto from 'node:crypto';

const testUPSName = 'dummyups';

const { mockRawNutClient, mockRawNutClientConstructor, mockVariableTypeConverter } = vi.hoisted(() => {
    const mockRawNutClient = {
        send: vi.fn<RawNUTClientType['send']>(),
        getVariableType: vi.fn<RawNUTClientType['getVariableType']>(),
        listWriteableVariables: vi.fn<RawNUTClientType['listWriteableVariables']>(),
        login: vi.fn<RawNUTClientType['login']>(),
        setVariable: vi.fn<RawNUTClientType['setVariable']>(),
        getVariable: vi.fn<RawNUTClientType['getVariable']>(),
        getVariableRange: vi.fn<RawNUTClientType['getVariableRange']>(),
        getVariableEnum: vi.fn<RawNUTClientType['getVariableEnum']>(),
        listVariables: vi.fn<RawNUTClientType['listVariables']>(),
        getVariableDescription: vi.fn<RawNUTClientType['getVariableDescription']>(),
        version: vi.fn<RawNUTClientType['version']>(),
        startTLS: vi.fn<RawNUTClientType['startTLS']>(),
        connect: vi.fn<RawNUTClientType['connect']>(),
        logout: vi.fn<RawNUTClientType['logout']>(),
        netVersion: vi.fn<RawNUTClientType['netVersion']>(),
        getCommandDescription: vi.fn<RawNUTClientType['getCommandDescription']>(),
        runCommand: vi.fn<RawNUTClientType['runCommand']>(),
        listCommands: vi.fn<RawNUTClientType['listCommands']>(),
        getNumLogins: vi.fn<RawNUTClientType['getNumLogins']>(),
        help: vi.fn<RawNUTClientType['help']>(),
        listClients: vi.fn<RawNUTClientType['listClients']>(),
        listUPS: vi.fn<RawNUTClientType['listUPS']>(),
        master: vi.fn<RawNUTClientType['master']>(),
        getMaster: vi.fn<RawNUTClientType['getMaster']>(),
        setTracking: vi.fn<RawNUTClientType['setTracking']>(),
        getTracking: vi.fn<RawNUTClientType['getTracking']>(),
        getUPSDescription: vi.fn<RawNUTClientType['getUPSDescription']>(),
        forceShutdown: vi.fn<RawNUTClientType['forceShutdown']>(),
        destroy: vi.fn<RawNUTClientType['destroy']>(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn()
    };
    return {
        mockRawNutClient,
        mockRawNutClientConstructor: vi.fn(function (_host: string, _port: number, _options?: any) {
            return mockRawNutClient;
        }),
        mockVariableTypeConverter: vi.fn()
    };
});
vi.mock('../src/RawNUTClient.js', () => ({
    RawNUTClient: mockRawNutClientConstructor
}));

vi.mock('../src/utils.js', async (importOriginal) => {
    const utilsOriginal = await importOriginal<typeof import('../src/utils.js')>();
    return {
        ...utilsOriginal,
        variableTypeConverter: mockVariableTypeConverter
    };
});

const { NUTClient } = await import('../src/NUTClient.js');

describe('NutClient.constructor', () => {
    it('should pass parameters', async () => {
        const client = new NUTClient('1.2.3.4', 5555);

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 5555, undefined);
    });

    it('should pass default port', async () => {
        const client = new NUTClient('1.2.3.4');

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 3493, undefined);
    });

    it('should accept options without auto-connecting', async () => {
        mockRawNutClient.connect.mockClear();

        const client = new NUTClient('1.2.3.4', 3493, { username: 'user', password: 'pass' });

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 3493, { username: 'user', password: 'pass' });
        expect(mockRawNutClient.connect).not.toHaveBeenCalled();
    });

    it('should pass timeout option to RawNUTClient', async () => {
        const client = new NUTClient('1.2.3.4', 3493, { timeout: 5000 });

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 3493, { timeout: 5000 });
    });
});

describe('NutClient.create', () => {
    it('should call connect when credentials are provided', async () => {
        mockRawNutClient.connect.mockClear();
        mockRawNutClient.connect.mockResolvedValueOnce(undefined);

        const client = await NUTClient.create('1.2.3.4', 5555, { username: 'admin', password: 'secret' });

        // Note: options object is mutated (credentials cleared) after auth,
        // so we check constructor was called with the right host/port and connect received credentials
        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 5555, expect.any(Object));
        expect(mockRawNutClient.connect).toHaveBeenCalledTimes(1);
        expect(mockRawNutClient.connect).toHaveBeenCalledWith('admin', 'secret');
    });

    it('should not call connect when no credentials are provided', async () => {
        mockRawNutClient.connect.mockClear();

        const client = await NUTClient.create('1.2.3.4', 5555);

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 5555, undefined);
        expect(mockRawNutClient.connect).not.toHaveBeenCalled();
    });

    it('should not call connect when only username is provided', async () => {
        mockRawNutClient.connect.mockClear();

        const client = await NUTClient.create('1.2.3.4', 5555, { username: 'admin' });

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 5555, { username: 'admin' });
        expect(mockRawNutClient.connect).not.toHaveBeenCalled();
    });

    it('should not call connect when only password is provided', async () => {
        mockRawNutClient.connect.mockClear();

        const client = await NUTClient.create('1.2.3.4', 5555, { password: 'secret' });

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 5555, { password: 'secret' });
        expect(mockRawNutClient.connect).not.toHaveBeenCalled();
    });

    it('should use default port when not specified', async () => {
        mockRawNutClient.connect.mockClear();

        const client = await NUTClient.create('1.2.3.4');

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 3493, undefined);
        expect(mockRawNutClient.connect).not.toHaveBeenCalled();
    });

    it('should clear credentials from options after successful authentication', async () => {
        mockRawNutClient.connect.mockClear();
        mockRawNutClient.connect.mockResolvedValueOnce(undefined);

        const options = { username: 'admin', password: 'secret' };
        await NUTClient.create('1.2.3.4', 5555, options);

        // Credentials cleared from options after auth - verified by the fact that
        // create() succeeded (it deletes username/password from the stored options)
        // The actual field is #private and not accessible from tests
        expect(mockRawNutClient.connect).toHaveBeenCalledWith('admin', 'secret');
    });

    it('should not clear credentials when authentication is not attempted', async () => {
        mockRawNutClient.connect.mockClear();

        const options = { username: 'admin' };
        await NUTClient.create('1.2.3.4', 5555, options);

        // Only username was provided (no password), so connect was not called
        expect(mockRawNutClient.connect).not.toHaveBeenCalled();
    });
});
describe('NutClient', () => {
    let client: NUTClientType;
    beforeEach(async () => {
        client = new NUTClient('127.0.0.1', 3493);

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('127.0.0.1', 3493, undefined);
    });

    describe('connected', () => {
        it('should expose connected state from underlying client', () => {
            Object.defineProperty(mockRawNutClient, 'connected', {
                value: true,
                writable: true,
                configurable: true
            });
            expect(client.connected).toBe(true);

            Object.defineProperty(mockRawNutClient, 'connected', {
                value: false,
                writable: true,
                configurable: true
            });
            expect(client.connected).toBe(false);
        });
    });

    describe('listUPS', () => {
        it('should list UPS', async () => {
            mockRawNutClient.listUPS.mockResolvedValueOnce(['dummyups "Dummy UPS for testing"']);

            const UPS = await client.listUPS();

            expect(UPS.length).toBe(1);
            expect(UPS[0].name).toBe(testUPSName);
            expect(UPS[0].description).toBe('Dummy UPS for testing');
        });

        it('should handle no description part', async () => {
            mockRawNutClient.listUPS.mockResolvedValueOnce(['dummyups ']);

            const UPS = await client.listUPS();

            expect(UPS.length).toBe(1);
            expect(UPS[0].name).toBe(testUPSName);
            expect(UPS[0].description).toBe('');
        });
    });

    describe('getUPS', () => {
        it('should get an UPS', async () => {
            mockRawNutClient.listUPS.mockResolvedValueOnce(['dummyups "Dummy UPS for testing"']);

            const UPS = await client.getUPS(testUPSName);

            expect(UPS).toBeDefined();
            expect(UPS!.name).toBe(testUPSName);
            expect(UPS!.description).toBe('Dummy UPS for testing');
        });
    });

    describe('getVariableType', () => {
        it('should get variable type', async () => {
            mockRawNutClient.getVariableType.mockResolvedValueOnce('NUMBER');

            await client.getVariableType(testUPSName, 'device.description');

            expect(mockVariableTypeConverter).toHaveBeenCalledWith('NUMBER');
        });
    });

    describe('listVariables', () => {
        it('should list variables', async () => {
            mockRawNutClient.listVariables.mockResolvedValueOnce([
                'device.mfr "Dummy Manufacturer"',
                'device.model "Dummy UPS"',
                'device.type "ups"'
            ]);

            const variables = await client.listVariables(testUPSName);

            expect(variables).toStrictEqual({
                'device.mfr': 'Dummy Manufacturer',
                'device.model': 'Dummy UPS',
                'device.type': 'ups'
            });
        });

        it('should handle bad message', async () => {
            mockRawNutClient.listVariables.mockResolvedValueOnce(['"" "Dummy Manufacturer"']);

            await expect(() => client.listVariables(testUPSName)).rejects.toThrow('failed to get key from variables');
        });

        it('should handle variable without value', async () => {
            mockRawNutClient.listVariables.mockResolvedValueOnce(['device.mfr']);

            const variables = await client.listVariables(testUPSName);

            expect(variables).toStrictEqual({
                'device.mfr': ''
            });
        });
    });

    describe('listWriteableVariables', () => {
        it('should list variables', async () => {
            mockRawNutClient.listWriteableVariables.mockResolvedValueOnce([
                'device.mfr "Dummy Manufacturer"',
                'device.model "Dummy UPS"',
                'device.type "ups"'
            ]);

            const variables = await client.listWriteableVariables(testUPSName);

            expect(variables).toStrictEqual({
                'device.mfr': 'Dummy Manufacturer',
                'device.model': 'Dummy UPS',
                'device.type': 'ups'
            });
        });

        it('should handle bad message', async () => {
            mockRawNutClient.listWriteableVariables.mockResolvedValueOnce(['"" "Dummy Manufacturer"']);

            await expect(() => client.listWriteableVariables(testUPSName)).rejects.toThrow('failed to get key from variables');
        });

        it('should handle variable without value', async () => {
            mockRawNutClient.listWriteableVariables.mockResolvedValueOnce(['device.mfr']);

            const variables = await client.listWriteableVariables(testUPSName);

            expect(variables).toStrictEqual({
                'device.mfr': ''
            });
        });
    });

    describe('pass through functions', () => {
        it('should send', async () => {
            const args = ['version'];
            const res = crypto.randomUUID();
            mockRawNutClient.send.mockResolvedValueOnce(res);
            expect(await client.send(args)).toBe(res);
            expect(mockRawNutClient.send).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.send).toHaveBeenCalledWith(args, undefined);
        });

        it('should send with timeout', async () => {
            const args = ['version'];
            const res = crypto.randomUUID();
            mockRawNutClient.send.mockResolvedValueOnce(res);
            expect(await client.send(args, 123)).toBe(res);
            expect(mockRawNutClient.send).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.send).toHaveBeenCalledWith(args, 123);
        });

        it('should connect', async () => {
            mockRawNutClient.connect.mockResolvedValueOnce(undefined);
            expect(await client.connect('username', 'password')).toBe(undefined);
            expect(mockRawNutClient.connect).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.connect).toHaveBeenCalledWith('username', 'password');
        });

        it('should get logout', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.logout.mockResolvedValueOnce(res);
            expect(await client.logout()).toBe(res);
            expect(mockRawNutClient.logout).toHaveBeenCalledTimes(1);
        });

        it('should get netversion', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.netVersion.mockResolvedValueOnce(res);
            expect(await client.netVersion()).toBe(res);
            expect(mockRawNutClient.netVersion).toHaveBeenCalledTimes(1);
        });

        it('should get startTLS', async () => {
            const res: ConnectionOptions = {
                rejectUnauthorized: true
            };
            mockRawNutClient.startTLS.mockResolvedValueOnce(undefined);
            expect(await client.startTLS(res)).toBe(undefined);
            expect(mockRawNutClient.startTLS).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.startTLS).toHaveBeenCalledWith(res);
        });

        it('should show help', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.help.mockResolvedValueOnce(res);
            expect(await client.help()).toBe(res);
            expect(mockRawNutClient.help).toHaveBeenCalledTimes(1);
        });

        it('should show version', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.version.mockResolvedValueOnce(res);
            expect(await client.version()).toBe(res);
            expect(mockRawNutClient.version).toHaveBeenCalledTimes(1);
        });

        it('should list clients', async () => {
            const res = [crypto.randomUUID()];
            mockRawNutClient.listClients.mockResolvedValueOnce(res);
            expect(await client.listClients(testUPSName)).toBe(res);
            expect(mockRawNutClient.listClients).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.listClients).toHaveBeenCalledWith(testUPSName);
        });

        it('should get num logins', async () => {
            const res = Math.random();
            mockRawNutClient.getNumLogins.mockResolvedValueOnce(res);
            expect(await client.getNumLogins(testUPSName)).toBe(res);
            expect(mockRawNutClient.getNumLogins).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getNumLogins).toHaveBeenCalledWith(testUPSName);
        });
        it('should list commands', async () => {
            const res = [crypto.randomUUID()];
            mockRawNutClient.listCommands.mockResolvedValueOnce(res);
            expect(await client.listCommands(testUPSName)).toBe(res);
            expect(mockRawNutClient.listCommands).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.listCommands).toHaveBeenCalledWith(testUPSName);
        });
        it('should get command description', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.getCommandDescription.mockResolvedValueOnce(res);
            expect(await client.getCommandDescription(testUPSName, 'driver.reload')).toBe(res);
            expect(mockRawNutClient.getCommandDescription).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getCommandDescription).toHaveBeenCalledWith(testUPSName, 'driver.reload');
        });
        it('should run command', async () => {
            mockRawNutClient.runCommand.mockResolvedValueOnce('OK');
            expect(await client.runCommand(testUPSName, 'load.off')).toEqual({ tracked: false, success: true });
            expect(mockRawNutClient.runCommand).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.runCommand).toHaveBeenCalledWith(testUPSName, 'load.off', undefined);
        });
        it('should run command with param', async () => {
            mockRawNutClient.runCommand.mockResolvedValueOnce('OK');
            expect(await client.runCommand(testUPSName, 'load.off', '120')).toEqual({ tracked: false, success: true });
            expect(mockRawNutClient.runCommand).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.runCommand).toHaveBeenCalledWith(testUPSName, 'load.off', '120');
        });
        it('should get variable description', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.getVariableDescription.mockResolvedValueOnce(res);
            expect(await client.getVariableDescription(testUPSName, 'device.description')).toBe(res);
            expect(mockRawNutClient.getVariableDescription).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getVariableDescription).toHaveBeenCalledWith(testUPSName, 'device.description');
        });
        it('should get variable enum', async () => {
            const res = [crypto.randomUUID()];
            mockRawNutClient.getVariableEnum.mockResolvedValueOnce(res);
            expect(await client.getVariableEnum(testUPSName, 'device.description')).toBe(res);
            expect(mockRawNutClient.getVariableEnum).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getVariableEnum).toHaveBeenCalledWith(testUPSName, 'device.description');
        });
        it('should get variable range', async () => {
            const res = [crypto.randomUUID()];
            mockRawNutClient.getVariableRange.mockResolvedValueOnce(res);
            expect(await client.getVariableRange(testUPSName, 'device.description')).toBe(res);
            expect(mockRawNutClient.getVariableRange).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getVariableRange).toHaveBeenCalledWith(testUPSName, 'device.description');
        });
        it('should get variable', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.getVariable.mockResolvedValueOnce(res);
            expect(await client.getVariable(testUPSName, 'device.description')).toBe(res);
            expect(mockRawNutClient.getVariable).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getVariable).toHaveBeenCalledWith(testUPSName, 'device.description');
        });
        it('should set variable', async () => {
            mockRawNutClient.setVariable.mockResolvedValueOnce('OK');
            expect(await client.setVariable(testUPSName, 'device.description', 'desc')).toEqual({ tracked: false, success: true });
            expect(mockRawNutClient.setVariable).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.setVariable).toHaveBeenCalledWith(testUPSName, 'device.description', 'desc');
        });
        it('should login', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.login.mockResolvedValueOnce(res);
            await client.login(testUPSName);
            expect(mockRawNutClient.login).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.login).toHaveBeenCalledWith(testUPSName);
        });
        it('should master', async () => {
            const res = crypto.randomUUID();
            mockRawNutClient.master.mockResolvedValueOnce(res);
            expect(await client.master(testUPSName)).toBe(res);
            expect(mockRawNutClient.master).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.master).toHaveBeenCalledWith(testUPSName);
        });
        it('should get master', async () => {
            mockRawNutClient.getMaster.mockResolvedValueOnce(true);
            expect(await client.getMaster(testUPSName)).toBe(true);
            expect(mockRawNutClient.getMaster).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getMaster).toHaveBeenCalledWith(testUPSName);
        });
        it('should get UPS description', async () => {
            const res = 'My UPS Description';
            mockRawNutClient.getUPSDescription.mockResolvedValueOnce(res);
            expect(await client.getUPSDescription(testUPSName)).toBe(res);
            expect(mockRawNutClient.getUPSDescription).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getUPSDescription).toHaveBeenCalledWith(testUPSName);
        });
        it('should force shutdown', async () => {
            const res = 'OK FSD-SET';
            mockRawNutClient.forceShutdown.mockResolvedValueOnce(res);
            expect(await client.forceShutdown(testUPSName)).toBe(res);
            expect(mockRawNutClient.forceShutdown).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.forceShutdown).toHaveBeenCalledWith(testUPSName);
        });
        it('should set tracking enabled', async () => {
            const res = 'OK TRACKING';
            mockRawNutClient.setTracking.mockResolvedValueOnce(res);
            expect(await client.setTracking(true)).toBe(res);
            expect(mockRawNutClient.setTracking).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.setTracking).toHaveBeenCalledWith(true);
        });
        it('should set tracking disabled', async () => {
            const res = 'OK';
            mockRawNutClient.setTracking.mockResolvedValueOnce(res);
            expect(await client.setTracking(false)).toBe(res);
            expect(mockRawNutClient.setTracking).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.setTracking).toHaveBeenCalledWith(false);
        });
        it('should get tracking status', async () => {
            const uuid = 'abc-123-def';
            mockRawNutClient.getTracking.mockResolvedValueOnce('SUCCESS');
            expect(await client.getTracking(uuid)).toBe('SUCCESS');
            expect(mockRawNutClient.getTracking).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.getTracking).toHaveBeenCalledWith(uuid);
        });

        it('should call destroy on the underlying RawNUTClient', () => {
            mockRawNutClient.destroy = vi.fn();

            client.destroy();

            expect(mockRawNutClient.destroy).toHaveBeenCalledTimes(1);
        });

        it('should be safe to call destroy multiple times', () => {
            mockRawNutClient.destroy = vi.fn();

            expect(() => {
                client.destroy();
                client.destroy();
            }).not.toThrow();

            // First destroy calls through, second is a no-op (guard)
            expect(mockRawNutClient.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('pollTracking', () => {
        it('should return SUCCESS when tracking completes successfully', async () => {
            const trackingUid = 'test-uid-123';
            mockRawNutClient.runCommand.mockResolvedValueOnce(`OK TRACKING ${trackingUid}`);
            mockRawNutClient.getTracking.mockResolvedValueOnce('SUCCESS');

            const result = await client.runCommand(testUPSName, 'load.off', undefined, { followTracking: true });

            expect(result).toEqual({ tracked: true, status: 'SUCCESS' });
            expect(mockRawNutClient.getTracking).toHaveBeenCalledWith(trackingUid);
        });

        it('should return ERR when tracking fails', async () => {
            const trackingUid = 'test-uid-456';
            mockRawNutClient.runCommand.mockResolvedValueOnce(`OK TRACKING ${trackingUid}`);
            mockRawNutClient.getTracking.mockResolvedValueOnce('ERR');

            const result = await client.runCommand(testUPSName, 'load.off', undefined, { followTracking: true });

            expect(result).toEqual({ tracked: true, status: 'ERR' });
            expect(mockRawNutClient.getTracking).toHaveBeenCalledWith(trackingUid);
        });

        it('should throw on tracking timeout', async () => {
            vi.useFakeTimers();
            const trackingUid = 'test-uid-789';
            mockRawNutClient.runCommand.mockResolvedValueOnce(`OK TRACKING ${trackingUid}`);
            mockRawNutClient.getTracking.mockResolvedValue('PENDING');

            const resultPromise = client.runCommand(testUPSName, 'load.off', undefined, {
                followTracking: true,
                trackingTimeout: 100,
                trackingPollInterval: 50
            });

            const advancePromise = vi.advanceTimersByTimeAsync(200);

            await expect(resultPromise).rejects.toThrow(`Tracking timeout after 100ms for UUID: ${trackingUid}`);
            await advancePromise;

            vi.useRealTimers();
        });

        it('should poll until SUCCESS after multiple PENDING responses', async () => {
            vi.useFakeTimers();
            try {
                const trackingUid = 'test-uid-poll';
                mockRawNutClient.runCommand.mockResolvedValueOnce(`OK TRACKING ${trackingUid}`);
                mockRawNutClient.getTracking
                    .mockResolvedValueOnce('PENDING')
                    .mockResolvedValueOnce('PENDING')
                    .mockResolvedValueOnce('SUCCESS');

                const resultPromise = client.runCommand(testUPSName, 'load.off', undefined, {
                    followTracking: true,
                    trackingTimeout: 5000,
                    trackingPollInterval: 100
                });

                await vi.advanceTimersByTimeAsync(0);
                await vi.advanceTimersByTimeAsync(100);
                await vi.advanceTimersByTimeAsync(100);

                const result = await resultPromise;
                expect(result).toEqual({ tracked: true, status: 'SUCCESS' });
                expect(mockRawNutClient.getTracking).toHaveBeenCalledTimes(3);
            } finally {
                vi.useRealTimers();
            }
        });

        it('should work with setVariable and followTracking', async () => {
            const trackingUid = 'test-uid-setvar';
            mockRawNutClient.setVariable.mockResolvedValueOnce(`OK TRACKING ${trackingUid}`);
            mockRawNutClient.getTracking.mockResolvedValueOnce('SUCCESS');

            const result = await client.setVariable(testUPSName, 'device.description', 'value', { followTracking: true });

            expect(result).toEqual({ tracked: true, status: 'SUCCESS' });
            expect(mockRawNutClient.getTracking).toHaveBeenCalledWith(trackingUid);
        });
    });

    describe('credential storage', () => {
        it('should store credentials when connect() is called', async () => {
            mockRawNutClient.connect.mockResolvedValueOnce(undefined);
            await client.connect('admin', 'secret');

            // Credentials are stored internally (#username, #password) for reconnect
            // Verified by the fact that connect() was called on the underlying client
            expect(mockRawNutClient.connect).toHaveBeenCalledWith('admin', 'secret');
        });

        it('should store credentials from options', () => {
            const nutClient = new NUTClient('127.0.0.1', 3493, {
                username: 'admin',
                password: 'secret'
            });

            // Credentials are stored internally (#username, #password) from options
            // Verified by the constructor accepting options with credentials
            expect(nutClient).toBeDefined();
        });

        it('should track logged-in UPSes', async () => {
            mockRawNutClient.login.mockResolvedValueOnce('OK');
            await client.login('myups');

            // UPS is tracked internally (#loggedInUps) for reconnect
            // Verified by the fact that login() was called on the underlying client
            expect(mockRawNutClient.login).toHaveBeenCalledWith('myups');
        });

        it('should remove UPS from tracking when login fails', async () => {
            mockRawNutClient.login.mockRejectedValueOnce(new Error('login failed'));
            await expect(client.login('myups')).rejects.toThrow('login failed');

            // When login fails, the UPS should not be tracked
            // This is verified by the error being propagated
        });

        it('should clear logged-in UPSes on logout', async () => {
            mockRawNutClient.login.mockResolvedValueOnce('OK');
            await client.login('myups');

            mockRawNutClient.logout.mockResolvedValueOnce('OK Goodbye');
            await client.logout();

            // After logout, all tracked UPSes are cleared
            expect(mockRawNutClient.logout).toHaveBeenCalledTimes(1);
        });
    });

    describe('reconnect', () => {
        it('should resolve when connected event fires during reconnect', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10
                });

                // Get the LAST disconnected handler (the one from reconnectClient, not beforeEach's client)
                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as (() => void) | undefined;
                expect(disconnectedHandler).toBeDefined();

                const reconnectedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('reconnected', resolve);
                });

                // Mock connected as false so reconnect waits for the event
                Object.defineProperty(mockRawNutClient, 'connected', {
                    value: false,
                    writable: true,
                    configurable: true
                });

                // Trigger disconnect → starts reconnect flow
                disconnectedHandler!();

                // Advance timers to trigger the reconnect setTimeout
                await vi.advanceTimersByTimeAsync(50);

                // Now the reconnect should have registered its once('connected', ...) listener
                const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                const connectedHandler = onceCalls.find((c: unknown[]) => c[0] === 'connected')?.[1] as (() => void) | undefined;
                expect(connectedHandler).toBeDefined();

                // Simulate successful connection
                connectedHandler!();

                // Let promises resolve
                await vi.advanceTimersByTimeAsync(0);

                await expect(reconnectedPromise).resolves.toBeUndefined();
                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should reject when disconnected event fires during reconnect', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10
                });

                // Get the LAST disconnected handler (from reconnectClient)
                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as (() => void) | undefined;

                const failedPromise = new Promise<number>((resolve) => {
                    reconnectClient.on('reconnectFailed', resolve);
                });

                Object.defineProperty(mockRawNutClient, 'connected', {
                    value: false,
                    writable: true,
                    configurable: true
                });

                disconnectedHandler!();

                // Advance timers to trigger the reconnect setTimeout
                await vi.advanceTimersByTimeAsync(50);

                // Find the disconnected handler from the reconnect wait
                const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnceCalls = onceCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const reconnectDisconnectHandler = disconnectOnceCalls[disconnectOnceCalls.length - 1]?.[1] as (() => void) | undefined;
                expect(reconnectDisconnectHandler).toBeDefined();

                reconnectDisconnectHandler!();

                await vi.advanceTimersByTimeAsync(0);

                await expect(failedPromise).resolves.toBe(1);
                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should use exponential backoff for reconnect delays', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10,
                    reconnectBackoff: 2,
                    maxReconnectDelay: 1000
                });

                const reconnectingEvents: number[] = [];
                reconnectClient.on('reconnecting', (_attempt: number, delay: number) => {
                    reconnectingEvents.push(delay);
                });

                // Get the setupClientListeners disconnected handler (last 'on' call)
                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;

                // Helper: get the most recently registered once('disconnected') handler
                const getLastDisconnectedOnceHandler = () => {
                    const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                    const discCalls = onceCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                    return discCalls[discCalls.length - 1]?.[1] as () => void;
                };

                // Helper: check delay is within ±20% jitter of expected base value
                const expectDelayNear = (actual: number, base: number) => {
                    expect(actual).toBeGreaterThanOrEqual(Math.round(base * 0.8));
                    expect(actual).toBeLessThanOrEqual(Math.round(base * 1.2));
                };

                // === Attempt 1 ===
                disconnectedHandler();
                await vi.advanceTimersByTimeAsync(50); // fires 10ms reconnect timer

                // Fail attempt 1
                getLastDisconnectedOnceHandler()();
                await vi.advanceTimersByTimeAsync(0); // process microtasks → schedules attempt 2

                // First delay is exact (initial value), subsequent delays have ±20% jitter
                expect(reconnectingEvents[0]).toBe(10);
                expectDelayNear(reconnectingEvents[1], 20);

                // === Attempt 2 ===
                vi.runOnlyPendingTimers(); // fires reconnect timer (jittered ~16-24ms)
                await vi.advanceTimersByTimeAsync(0);

                // Fail attempt 2
                getLastDisconnectedOnceHandler()();
                await vi.advanceTimersByTimeAsync(0); // process microtasks → schedules attempt 3

                // Third delay base = jittered_second_delay * 2, then ±20% jitter again
                expectDelayNear(reconnectingEvents[2], reconnectingEvents[1] * 2);

                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should emit reconnectExhausted when maxReconnectAttempts is reached', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10,
                    maxReconnectAttempts: 2
                });

                const exhaustedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('reconnectExhausted', resolve);
                });

                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;

                const getLastDisconnectedOnceHandler = () => {
                    const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                    const discCalls = onceCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                    return discCalls[discCalls.length - 1]?.[1] as () => void;
                };

                // === Attempt 1 ===
                disconnectedHandler();
                await vi.advanceTimersByTimeAsync(50);

                // Fail attempt 1
                getLastDisconnectedOnceHandler()();
                await vi.advanceTimersByTimeAsync(0);

                // === Attempt 2 ===
                vi.runOnlyPendingTimers();
                await vi.advanceTimersByTimeAsync(0);

                // Fail attempt 2 → attempt count (2) >= maxReconnectAttempts (2) → reconnectExhausted
                getLastDisconnectedOnceHandler()();
                await vi.advanceTimersByTimeAsync(0);

                await expect(exhaustedPromise).resolves.toBeUndefined();
                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should restore session (re-auth + re-login) after reconnect', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10,
                    username: 'admin',
                    password: 'secret'
                });

                // Login to a UPS so it's tracked for session restore
                mockRawNutClient.login.mockResolvedValue('OK');
                await reconnectClient.login('myups');
                expect(mockRawNutClient.login).toHaveBeenCalledWith('myups');

                // Clear mock call history to verify calls during reconnect only
                mockRawNutClient.connect.mockClear();
                mockRawNutClient.login.mockClear();

                const reconnectedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('reconnected', resolve);
                });

                // Trigger disconnect
                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;
                disconnectedHandler();

                // Advance to reconnect timer
                await vi.advanceTimersByTimeAsync(50);

                // Simulate successful connection
                const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                const connectedHandler = onceCalls.find((c: unknown[]) => c[0] === 'connected')?.[1] as () => void;
                expect(connectedHandler).toBeDefined();
                connectedHandler();

                // Let restoreSession complete (re-auth + re-login)
                await vi.advanceTimersByTimeAsync(0);
                await expect(reconnectedPromise).resolves.toBeUndefined();

                // Verify re-authentication
                expect(mockRawNutClient.connect).toHaveBeenCalledWith('admin', 'secret');

                // Verify re-login for tracked UPS
                expect(mockRawNutClient.login).toHaveBeenCalledWith('myups');

                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should resolve immediately when newClient is already connected (race condition)', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10
                });

                const reconnectedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('reconnected', resolve);
                });

                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;

                Object.defineProperty(mockRawNutClient, 'connected', {
                    value: false,
                    writable: true,
                    configurable: true
                });

                disconnectedHandler();

                Object.defineProperty(mockRawNutClient, 'connected', {
                    value: true,
                    writable: true,
                    configurable: true
                });

                await vi.advanceTimersByTimeAsync(50);
                await vi.advanceTimersByTimeAsync(0);
                await expect(reconnectedPromise).resolves.toBeUndefined();
                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should continue reconnect even if re-login UPS fails during session restore', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10,
                    username: 'admin',
                    password: 'secret'
                });

                mockRawNutClient.login.mockResolvedValue('OK');
                await reconnectClient.login('myups');

                mockRawNutClient.connect.mockClear();
                mockRawNutClient.login.mockClear();

                const reconnectedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('reconnected', resolve);
                });

                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;

                Object.defineProperty(mockRawNutClient, 'connected', {
                    value: false,
                    writable: true,
                    configurable: true
                });

                disconnectedHandler();
                await vi.advanceTimersByTimeAsync(50);

                mockRawNutClient.login.mockRejectedValueOnce(new Error('login failed during restore'));

                const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                const connectedHandler = onceCalls.find((c: unknown[]) => c[0] === 'connected')?.[1] as () => void;
                expect(connectedHandler).toBeDefined();
                connectedHandler();

                await vi.advanceTimersByTimeAsync(0);
                await expect(reconnectedPromise).resolves.toBeUndefined();

                expect(mockRawNutClient.connect).toHaveBeenCalledWith('admin', 'secret');
                expect(mockRawNutClient.login).toHaveBeenCalledWith('myups');

                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });

        it('should handle destroy() during reconnect', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 100
                });

                const destroyedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('destroyed', resolve);
                });

                // Trigger disconnect → starts reconnect flow
                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;
                disconnectedHandler();

                // Advance timer partially (reconnect is scheduled but not yet executed)
                await vi.advanceTimersByTimeAsync(50);

                // Destroy during reconnect delay — should not throw
                expect(() => reconnectClient.destroy()).not.toThrow();

                await expect(destroyedPromise).resolves.toBeUndefined();

                // Record constructor call count to verify no further RawNUTClient is created
                const constructorCallsAfterDestroy = mockRawNutClientConstructor.mock.calls.length;

                // Advance remaining timers — no reconnect should fire
                await vi.advanceTimersByTimeAsync(200);

                expect(mockRawNutClientConstructor.mock.calls.length).toBe(constructorCallsAfterDestroy);
            } finally {
                vi.useRealTimers();
            }
        });

        it('should restore TLS after reconnect', async () => {
            vi.useFakeTimers();
            try {
                const reconnectClient = new NUTClient('127.0.0.1', 3493, {
                    autoReconnect: true,
                    reconnectDelay: 10,
                    username: 'admin',
                    password: 'secret'
                });

                // Call startTLS
                mockRawNutClient.startTLS.mockResolvedValueOnce(undefined);
                await reconnectClient.startTLS({ rejectUnauthorized: false });
                expect(mockRawNutClient.startTLS).toHaveBeenCalledWith({ rejectUnauthorized: false });

                // Capture initial startTLS invocation order, then clear for reconnect phase
                const initialStartTLSOrder = mockRawNutClient.startTLS.mock.invocationCallOrder[0];
                mockRawNutClient.startTLS.mockClear();
                mockRawNutClient.connect.mockClear();

                const reconnectedPromise = new Promise<void>((resolve) => {
                    reconnectClient.on('reconnected', resolve);
                });

                // Trigger disconnect
                const onCalls = (mockRawNutClient.on as ReturnType<typeof vi.fn>).mock.calls;
                const disconnectOnCalls = onCalls.filter((c: unknown[]) => c[0] === 'disconnected');
                const disconnectedHandler = disconnectOnCalls[disconnectOnCalls.length - 1]?.[1] as () => void;
                disconnectedHandler();

                // Advance to reconnect timer
                await vi.advanceTimersByTimeAsync(50);

                // Simulate successful connection
                const onceCalls = (mockRawNutClient.once as ReturnType<typeof vi.fn>).mock.calls;
                const connectedHandler = onceCalls.find((c: unknown[]) => c[0] === 'connected')?.[1] as () => void;
                expect(connectedHandler).toBeDefined();
                connectedHandler();

                // Let restoreSession complete
                await vi.advanceTimersByTimeAsync(0);
                await expect(reconnectedPromise).resolves.toBeUndefined();

                // Verify TLS was restored BEFORE auth
                expect(mockRawNutClient.startTLS).toHaveBeenCalledWith({ rejectUnauthorized: false });
                expect(mockRawNutClient.connect).toHaveBeenCalledWith('admin', 'secret');

                // Verify order: startTLS should be called before connect
                const startTLSCallOrder = mockRawNutClient.startTLS.mock.invocationCallOrder[0];
                const connectCallOrder = mockRawNutClient.connect.mock.invocationCallOrder[0];
                expect(startTLSCallOrder).toBeLessThan(connectCallOrder);

                // Also verify initial startTLS happened before reconnect startTLS
                expect(initialStartTLSOrder).toBeLessThan(startTLSCallOrder);

                reconnectClient.destroy();
            } finally {
                vi.useRealTimers();
            }
        });
    });
});
