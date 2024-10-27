import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UPS } from '../src/UPS.js';
import type { NUTClient as NUTClientType } from '../src/NUTClient.js';
import crypto from 'node:crypto';

const testUPSName = 'dummyups';

const mockNutClient = {
    listVariables: jest.fn<NUTClientType['listVariables']>(),
    getVariableType: jest.fn<NUTClientType['getVariableType']>(),
    listWriteableVariables: jest.fn<NUTClientType['listWriteableVariables']>(),
    login: jest.fn<NUTClientType['login']>(),
    getNumLogins: jest.fn<NUTClientType['getNumLogins']>(),
    listClients: jest.fn<NUTClientType['listClients']>(),
    getVariableEnum: jest.fn<NUTClientType['getVariableEnum']>(),
    getCommandDescription: jest.fn<NUTClientType['getCommandDescription']>(),
    getVariable: jest.fn<NUTClientType['getVariable']>(),
    setVariable: jest.fn<NUTClientType['setVariable']>(),
    getVariableRange: jest.fn<NUTClientType['getVariableRange']>(),
    getVariableDescription: jest.fn<NUTClientType['getVariableDescription']>(),
    listCommands: jest.fn<NUTClientType['listCommands']>()
};
const mockNutClientConstructor = jest.fn(() => mockNutClient);
jest.unstable_mockModule('../src/NUTClient.js', () => ({
    NUTClient: mockNutClientConstructor
}));

const { NUTClient } = await import('../src/NUTClient.js');

describe('UPS', () => {
    describe('constructor', () => {
        it('should construct', async () => {
            new UPS(new NUTClient('127.0.0.1', 3493), 'dummyups', 'testups');
            new UPS(new NUTClient('127.0.0.1', 3493), 'dummyups', '');
        });

        it('should avoid empty name', async () => {
            expect(() => new UPS(new NUTClient('127.0.0.1', 3493), '', '')).toThrow();
        });
    });

    let ups: UPS;
    beforeEach(async () => {
        ups = new UPS(new NUTClient('127.0.0.1', 3493), 'dummyups', 'testups');
    });

    it('should list variables', async () => {
        const res = { 'battery.status': crypto.randomUUID() };
        mockNutClient.listVariables.mockResolvedValueOnce(res);
        expect(await ups.listVariables()).toBe(res);
        expect(mockNutClient.listVariables).toHaveBeenCalledTimes(1);
        expect(mockNutClient.listVariables).toHaveBeenCalledWith(testUPSName);
    });

    it('should list commands', async () => {
        const res = [crypto.randomUUID()];
        mockNutClient.listCommands.mockResolvedValueOnce(res);
        expect(await ups.listCommands()).toBe(res);
        expect(mockNutClient.listCommands).toHaveBeenCalledTimes(1);
        expect(mockNutClient.listCommands).toHaveBeenCalledWith(testUPSName);
    });

    it('should get variable type', async () => {
        const res = {
            type: 'NUMBER'
        } as const;
        mockNutClient.getVariableType.mockResolvedValueOnce(res);
        expect(await ups.getVariableType('device.description')).toBe(res);
        expect(mockNutClient.getVariableType).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getVariableType).toHaveBeenCalledWith(testUPSName, 'device.description');
    });

    it('should get variable description', async () => {
        const res = crypto.randomUUID();
        mockNutClient.getVariableDescription.mockResolvedValueOnce(res);
        expect(await ups.getVariableDescription('device.description')).toBe(res);
        expect(mockNutClient.getVariableDescription).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getVariableDescription).toHaveBeenCalledWith(testUPSName, 'device.description');
    });

    it('should get variable enum', async () => {
        const res = [crypto.randomUUID()];
        mockNutClient.getVariableEnum.mockResolvedValueOnce(res);
        expect(await ups.getVariableEnum('device.description')).toBe(res);
        expect(mockNutClient.getVariableEnum).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getVariableEnum).toHaveBeenCalledWith(testUPSName, 'device.description');
    });

    it('should get variable range', async () => {
        const res = [crypto.randomUUID()];
        mockNutClient.getVariableRange.mockResolvedValueOnce(res);
        expect(await ups.getVariableRange('device.description')).toBe(res);
        expect(mockNutClient.getVariableRange).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getVariableRange).toHaveBeenCalledWith(testUPSName, 'device.description');
    });

    it('should get variable', async () => {
        const res = crypto.randomUUID();
        mockNutClient.getVariable.mockResolvedValueOnce(res);
        expect(await ups.getVariable('device.description')).toBe(res);
        expect(mockNutClient.getVariable).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getVariable).toHaveBeenCalledWith(testUPSName, 'device.description');
    });

    it('should get command description', async () => {
        const res = crypto.randomUUID();
        mockNutClient.getCommandDescription.mockResolvedValueOnce(res);
        expect(await ups.getCommandDescription('test.reload')).toBe(res);
        expect(mockNutClient.getCommandDescription).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getCommandDescription).toHaveBeenCalledWith(testUPSName, 'test.reload');
    });

    it('should list clients', async () => {
        const res = [crypto.randomUUID()];
        mockNutClient.listClients.mockResolvedValueOnce(res);
        expect(await ups.listClients()).toBe(res);
        expect(mockNutClient.listClients).toHaveBeenCalledTimes(1);
        expect(mockNutClient.listClients).toHaveBeenCalledWith(testUPSName);
    });

    it('should set variable', async () => {
        const res = crypto.randomUUID();
        mockNutClient.setVariable.mockResolvedValueOnce(res);
        expect(await ups.setVariable('device.description', 'test')).toBe(res);
        expect(mockNutClient.setVariable).toHaveBeenCalledTimes(1);
        expect(mockNutClient.setVariable).toHaveBeenCalledWith(testUPSName, 'device.description', 'test');
    });

    it('should list writeable variable', async () => {
        const res = { 'device.model': crypto.randomUUID() };
        mockNutClient.listWriteableVariables.mockResolvedValueOnce(res);
        expect(await ups.listWriteableVariables()).toBe(res);
        expect(mockNutClient.listWriteableVariables).toHaveBeenCalledTimes(1);
        expect(mockNutClient.listWriteableVariables).toHaveBeenCalledWith(testUPSName);
    });

    it('should get num login', async () => {
        const res = Math.random();
        mockNutClient.getNumLogins.mockResolvedValueOnce(res);
        expect(await ups.getNumLogins()).toBe(res);
        expect(mockNutClient.getNumLogins).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getNumLogins).toHaveBeenCalledWith(testUPSName);
    });

    it('should login', async () => {
        mockNutClient.login.mockResolvedValueOnce('');
        await ups.login();
        expect(mockNutClient.login).toHaveBeenCalledTimes(1);
        expect(mockNutClient.login).toHaveBeenCalledWith(testUPSName);
    });
});
