import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NUTClient as NUTClientType } from '../src/NUTClient.js';
import type { RawNUTClient as RawNUTClientType } from '../src/RawNUTClient.js';
import type { ConnectionOptions } from 'tls';
import crypto from 'node:crypto';

const testUPSName = 'dummyups';

const mockRawNutClient = {
    send: jest.fn<RawNUTClientType['send']>(),
    getVariableType: jest.fn<RawNUTClientType['getVariableType']>(),
    listWriteableVariables: jest.fn<RawNUTClientType['listWriteableVariables']>(),
    setVariable: jest.fn<RawNUTClientType['setVariable']>(),
    getVariable: jest.fn<RawNUTClientType['getVariable']>(),
    getVariableRange: jest.fn<RawNUTClientType['getVariableRange']>(),
    getVariableEnum: jest.fn<RawNUTClientType['getVariableEnum']>(),
    listVariables: jest.fn<RawNUTClientType['listVariables']>(),
    getVariableDescription: jest.fn<RawNUTClientType['getVariableDescription']>(),
    version: jest.fn<RawNUTClientType['version']>(),
    startTLS: jest.fn<RawNUTClientType['startTLS']>(),
    connect: jest.fn<RawNUTClientType['connect']>(),
    logout: jest.fn<RawNUTClientType['logout']>(),
    netVersion: jest.fn<RawNUTClientType['netVersion']>(),
    getCommandDescription: jest.fn<RawNUTClientType['getCommandDescription']>(),
    listCommands: jest.fn<RawNUTClientType['listCommands']>(),
    getNumLogins: jest.fn<RawNUTClientType['getNumLogins']>(),
    help: jest.fn<RawNUTClientType['help']>(),
    listClients: jest.fn<RawNUTClientType['listClients']>(),
    listUPS: jest.fn<RawNUTClientType['listUPS']>()
};
const mockRawNutClientConstructor = jest.fn(() => mockRawNutClient);
jest.unstable_mockModule('../src/RawNUTClient.js', () => ({
    RawNUTClient: mockRawNutClientConstructor
}));

const utilsOriginal = await import('../src/utils.js');

const mockVariableTypeConverter = jest.fn();
jest.unstable_mockModule('../src/utils.js', async () => ({
    ...utilsOriginal,
    variableTypeConverter: mockVariableTypeConverter
}));

const { NUTClient } = await import('../src/NUTClient.js');

describe('NutClient.constructor', () => {
    it('should pass parameters', async () => {
        new NUTClient('1.2.3.4', 5555);

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 5555);
    });

    it('should pass default port', async () => {
        new NUTClient('1.2.3.4');

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('1.2.3.4', 3493);
    });
});
describe('NutClient', () => {
    let client: NUTClientType;
    beforeEach(async () => {
        client = new NUTClient('127.0.0.1', 3493);

        expect(mockRawNutClientConstructor).toHaveBeenCalledWith('127.0.0.1', 3493);
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

            await expect(() => client.listVariables(testUPSName)).rejects.toThrowError('fail to get key from variables');
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

            await expect(() => client.listWriteableVariables(testUPSName)).rejects.toThrowError('fail to get key from variables');
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
            const res = crypto.randomUUID();
            mockRawNutClient.setVariable.mockResolvedValueOnce(res);
            expect(await client.setVariable(testUPSName, 'device.description', 'desc')).toBe(res);
            expect(mockRawNutClient.setVariable).toHaveBeenCalledTimes(1);
            expect(mockRawNutClient.setVariable).toHaveBeenCalledWith(testUPSName, 'device.description', 'desc');
        });
    });
});
