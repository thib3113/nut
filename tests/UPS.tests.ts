import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UPS } from '../src/UPS.js';
import { ENUTStatus } from '../src/ENUTStatus.js';
import { VarNotSupportedError } from '../src/Errors/index.js';
import type { NUTClient as NUTClientType } from '../src/NUTClient.js';
import crypto from 'node:crypto';

const testUPSName = 'dummyups';

const { mockNutClient, mockNutClientConstructor } = vi.hoisted(() => {
    const mockNutClient = {
        listVariables: vi.fn<NUTClientType['listVariables']>(),
        getVariableType: vi.fn<NUTClientType['getVariableType']>(),
        listWriteableVariables: vi.fn<NUTClientType['listWriteableVariables']>(),
        login: vi.fn<NUTClientType['login']>(),
        getNumLogins: vi.fn<NUTClientType['getNumLogins']>(),
        listClients: vi.fn<NUTClientType['listClients']>(),
        getVariableEnum: vi.fn<NUTClientType['getVariableEnum']>(),
        getCommandDescription: vi.fn<NUTClientType['getCommandDescription']>(),
        runCommand: vi.fn<NUTClientType['runCommand']>(),
        getVariable: vi.fn<NUTClientType['getVariable']>(),
        setVariable: vi.fn<NUTClientType['setVariable']>(),
        getVariableRange: vi.fn<NUTClientType['getVariableRange']>(),
        getVariableDescription: vi.fn<NUTClientType['getVariableDescription']>(),
        listCommands: vi.fn<NUTClientType['listCommands']>(),
        master: vi.fn<NUTClientType['master']>(),
        getMaster: vi.fn<NUTClientType['getMaster']>()
    };
    return {
        mockNutClient,
        mockNutClientConstructor: vi.fn(function () {
            return mockNutClient;
        })
    };
});
vi.mock('../src/NUTClient.js', () => ({
    NUTClient: mockNutClientConstructor
}));

const { NUTClient } = await import('../src/NUTClient.js');

describe('UPS', () => {
    describe('constructor', () => {
        it('should construct', async () => {
            const ups1 = new UPS(new NUTClient('127.0.0.1', 3493), 'dummyups', 'testups');
            const ups2 = new UPS(new NUTClient('127.0.0.1', 3493), 'dummyups', '');
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

    it('should run command', async () => {
        const res = crypto.randomUUID();
        mockNutClient.runCommand.mockResolvedValueOnce(res);
        expect(await ups.runCommand('load.off')).toBe(res);
        expect(mockNutClient.runCommand).toHaveBeenCalledTimes(1);
        expect(mockNutClient.runCommand).toHaveBeenCalledWith(testUPSName, 'load.off');
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

    it('should master', async () => {
        const res = crypto.randomUUID();
        mockNutClient.master.mockResolvedValueOnce(res);
        expect(await ups.master()).toBe(res);
        expect(mockNutClient.master).toHaveBeenCalledTimes(1);
        expect(mockNutClient.master).toHaveBeenCalledWith(testUPSName);
    });

    it('should get master', async () => {
        mockNutClient.getMaster.mockResolvedValueOnce(true);
        expect(await ups.getMaster()).toBe(true);
        expect(mockNutClient.getMaster).toHaveBeenCalledTimes(1);
        expect(mockNutClient.getMaster).toHaveBeenCalledWith(testUPSName);
    });

    describe('convenience methods', () => {
        describe('getStatus', () => {
            it('should parse single status', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OL');
                const result = await ups.getStatus();
                expect(result).toEqual([ENUTStatus.OL]);
                expect(mockNutClient.getVariable).toHaveBeenCalledWith(testUPSName, 'ups.status');
            });

            it('should parse multiple space-separated statuses', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OL CHRG');
                const result = await ups.getStatus();
                expect(result).toEqual([ENUTStatus.OL, ENUTStatus.CHRG]);
            });

            it('should parse three statuses', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OB LB DISCHRG');
                const result = await ups.getStatus();
                expect(result).toEqual([ENUTStatus.OB, ENUTStatus.LB, ENUTStatus.DISCHRG]);
            });

            it('should filter out unknown status values', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OL UNKNOWN_STATUS CHRG');
                const result = await ups.getStatus();
                expect(result).toEqual([ENUTStatus.OL, ENUTStatus.CHRG]);
            });

            it('should handle extra whitespace', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('  OL   CHRG  ');
                const result = await ups.getStatus();
                expect(result).toEqual([ENUTStatus.OL, ENUTStatus.CHRG]);
            });

            it('should return empty array when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                const result = await ups.getStatus();
                expect(result).toEqual([]);
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getStatus()).rejects.toThrow('Connection refused');
            });
        });

        describe('isOnBattery', () => {
            it('should return true when OB is present', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OB DISCHRG');
                expect(await ups.isOnBattery()).toBe(true);
            });

            it('should return false when OB is not present', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OL CHRG');
                expect(await ups.isOnBattery()).toBe(false);
            });

            it('should return false when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.isOnBattery()).toBe(false);
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.isOnBattery()).rejects.toThrow('Connection refused');
            });
        });

        describe('isOnline', () => {
            it('should return true when OL is present', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OL CHRG');
                expect(await ups.isOnline()).toBe(true);
            });

            it('should return false when OL is not present', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('OB');
                expect(await ups.isOnline()).toBe(false);
            });

            it('should return false when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.isOnline()).toBe(false);
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.isOnline()).rejects.toThrow('Connection refused');
            });
        });

        describe('getBatteryCharge', () => {
            it('should return parsed number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('75');
                expect(await ups.getBatteryCharge()).toBe(75);
            });

            it('should return parsed float', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('99.5');
                expect(await ups.getBatteryCharge()).toBe(99.5);
            });

            it('should return NaN when variable is not a number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('not-a-number');
                expect(await ups.getBatteryCharge()).toBeNaN();
            });

            it('should return NaN when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getBatteryCharge()).toBeNaN();
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getBatteryCharge()).rejects.toThrow('Connection refused');
            });
        });

        describe('getBatteryRuntime', () => {
            it('should return parsed number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('1800');
                expect(await ups.getBatteryRuntime()).toBe(1800);
            });

            it('should return NaN when variable is not a number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('unknown');
                expect(await ups.getBatteryRuntime()).toBeNaN();
            });

            it('should return NaN when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getBatteryRuntime()).toBeNaN();
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getBatteryRuntime()).rejects.toThrow('Connection refused');
            });
        });

        describe('getLoad', () => {
            it('should return parsed number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('42');
                expect(await ups.getLoad()).toBe(42);
            });

            it('should return NaN when variable is not a number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('N/A');
                expect(await ups.getLoad()).toBeNaN();
            });

            it('should return NaN when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getLoad()).toBeNaN();
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getLoad()).rejects.toThrow('Connection refused');
            });
        });

        describe('getInputVoltage', () => {
            it('should return parsed number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('230.5');
                expect(await ups.getInputVoltage()).toBe(230.5);
            });

            it('should return NaN when variable is not a number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('invalid');
                expect(await ups.getInputVoltage()).toBeNaN();
            });

            it('should return NaN when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getInputVoltage()).toBeNaN();
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getInputVoltage()).rejects.toThrow('Connection refused');
            });
        });

        describe('getOutputVoltage', () => {
            it('should return parsed number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('229.8');
                expect(await ups.getOutputVoltage()).toBe(229.8);
            });

            it('should return NaN when variable is not a number', async () => {
                mockNutClient.getVariable.mockResolvedValueOnce('invalid');
                expect(await ups.getOutputVoltage()).toBeNaN();
            });

            it('should return NaN when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getOutputVoltage()).toBeNaN();
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getOutputVoltage()).rejects.toThrow('Connection refused');
            });
        });

        describe('getModel', () => {
            it('should return model string', async () => {
                const model = 'Back-UPS Pro 1500';
                mockNutClient.getVariable.mockResolvedValueOnce(model);
                expect(await ups.getModel()).toBe(model);
                expect(mockNutClient.getVariable).toHaveBeenCalledWith(testUPSName, 'ups.model');
            });

            it('should return empty string when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getModel()).toBe('');
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getModel()).rejects.toThrow('Connection refused');
            });
        });

        describe('getManufacturer', () => {
            it('should return manufacturer string', async () => {
                const mfr = 'APC';
                mockNutClient.getVariable.mockResolvedValueOnce(mfr);
                expect(await ups.getManufacturer()).toBe(mfr);
                expect(mockNutClient.getVariable).toHaveBeenCalledWith(testUPSName, 'ups.mfr');
            });

            it('should return empty string when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getManufacturer()).toBe('');
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getManufacturer()).rejects.toThrow('Connection refused');
            });
        });

        describe('getSerial', () => {
            it('should return serial string', async () => {
                const serial = 'ABC123456789';
                mockNutClient.getVariable.mockResolvedValueOnce(serial);
                expect(await ups.getSerial()).toBe(serial);
                expect(mockNutClient.getVariable).toHaveBeenCalledWith(testUPSName, 'ups.serial');
            });

            it('should return empty string when variable is not supported', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new VarNotSupportedError());
                expect(await ups.getSerial()).toBe('');
            });

            it('should throw on connection errors', async () => {
                mockNutClient.getVariable.mockRejectedValueOnce(new Error('Connection refused'));
                await expect(ups.getSerial()).rejects.toThrow('Connection refused');
            });
        });
    });
});
