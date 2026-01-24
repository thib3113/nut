import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { RawNUTClient } from '../src/index.js';
import { setTimeout } from 'node:timers/promises';
import { TLSSocket } from 'tls';
import { setInterval } from 'timers/promises';

const testUPSName = 'dummyups';

describe('connection tests', () => {
    let client: RawNUTClient;

    afterEach(async () => {
        // @ts-expect-error
        if (client?._tcpClient.readyState != 'closed') {
            await client?.logout();
        }
    });

    it('should connect', async () => {
        client = new RawNUTClient('127.0.0.1', 3493);

        //await a command to wait the socket to be connected
        await client.version();
    });

    it('should logout', async () => {
        client = new RawNUTClient('127.0.0.1', 3493);
        await client.version();
        expect(await client.logout()).toBe('OK Goodbye');

        await setTimeout(10);
        // @ts-ignore
        expect(client._tcpClient.readyState).toBe('closed');
        expect(client.connected).toBe(false);
    });

    describe('connection', () => {
        let client: RawNUTClient;
        beforeEach(async () => {
            client = new RawNUTClient('127.0.0.1', 3493);
        });

        afterEach(async () => {
            // @ts-expect-error
            if (client?._tcpClient.readyState != 'closed') {
                await client?.logout();
            }
        });

        it('should succeed with connection', async () => {
            await client.connect('user', 'secret');
            await client.runCommand(testUPSName, 'driver.reload');
        });

        it('should fail if invalid username', async () => {
            await client.connect('baduser', 'secret');
            await expect(() => client.runCommand(testUPSName, 'driver.reload')).rejects.toThrow(
                'The client’s host and/or authentication details (username, password) are not sufficient to execute the requested command.'
            );
        });

        it('should fail if invalid password', async () => {
            await client.connect('user', 'badsecret');
            await expect(() => client.runCommand(testUPSName, 'driver.reload')).rejects.toThrow(
                'The client’s host and/or authentication details (username, password) are not sufficient to execute the requested command.'
            );
        });
    });
});

describe('usage tests', () => {
    let client: RawNUTClient;
    beforeEach(async () => {
        client = new RawNUTClient('127.0.0.1', 3493);
        await client.connect('user', 'secret');
    });

    afterEach(async () => {
        // @ts-expect-error
        if (client?._tcpClient.readyState != 'closed') {
            await client?.logout();
        }

        const controller = new AbortController();

        for await (const _ of setInterval(10, null, {
            signal: controller.signal
        })) {
            if (client.client.readyState === 'closed') {
                controller.abort();
                return;
            }
        }
    });

    it('should list UPS', async () => {
        const UPS = await client.listUPS();

        expect(UPS.length).toBe(1);
        expect(UPS[0]).toEqual('dummyups "Dummy UPS for testing"');
        // expect(UPS[0].name).toBe(testUPSName);
        // expect(UPS[0].description).toBe('Dummy UPS for testing');
    });

    it('should get netversion', async () => {
        expect(await client.netVersion()).toMatch(/[0-9]+\.[0-9]+/);
    });

    it('should show help', async () => {
        expect((await client.help()).startsWith('Commands: ')).toBeTruthy();
    });

    it('should list clients', async () => {
        await client.login(testUPSName);
        const clients = await client.listClients(testUPSName);
        expect(clients.length).toBe(1);
        //will match the current ip of the client
        expect(clients[0]).toMatch(/^((25[0-5]|2[0-4]\d|[01]?\d?\d)\.?\b){4}$/);
    });

    it('should get num logins', async () => {
        await client.login(testUPSName);
        const clients = await client.getNumLogins(testUPSName);
        expect(clients).toBe(1);
    });

    describe('commands', () => {
        it('should list commands', async () => {
            expect(await client.listCommands(testUPSName)).toContain('driver.reload');
        });
        it('should get command description', async () => {
            expect(await client.getCommandDescription(testUPSName, 'driver.reload')).toBe(
                'Reload running driver configuration from the file system (only works for changes in some options)'
            );
        });
    });

    describe('variables', () => {
        afterEach(async () => {
            await client.setVariable(testUPSName, 'ups.status', 'OL');
        });

        it('should list variables', async () => {
            expect(await client.listVariables(testUPSName)).toStrictEqual(
                expect.arrayContaining(['device.mfr "Dummy Manufacturer"', 'device.model "Dummy UPS"', 'device.type "ups"'])
            );
        });

        it('should get variable "device.model"', async () => {
            expect(await client.getVariable(testUPSName, 'device.model')).toStrictEqual('Dummy UPS');
        });

        it('should get variable type', async () => {
            // NUMBER is the default value if driver don't specify it
            expect(await client.getVariableType(testUPSName, 'device.mfr')).toBe('NUMBER');
        });

        it('should get variable description', async () => {
            expect(await client.getVariableDescription(testUPSName, 'device.mfr')).toBe('Description unavailable');
        });

        it('should get variable enum', async () => {
            // empty on all variables on dummyups
            expect(await client.getVariableEnum(testUPSName, 'device.mfr')).toStrictEqual([]);
        });

        it('should get variable range', async () => {
            // empty on all variables on dummyups
            expect(await client.getVariableRange(testUPSName, 'device.mfr')).toStrictEqual([]);
        });

        it('should get writeable variables', async () => {
            expect(await client.listWriteableVariables(testUPSName)).toStrictEqual(expect.arrayContaining(['ups.status "OL"']));
        });

        it('should write variable', async () => {
            expect(await client.setVariable(testUPSName, 'ups.status', 'OB')).toStrictEqual('OK');

            //passing variable to driver can take time
            await setTimeout(2 * 1000);

            expect(await client.getVariable(testUPSName, 'ups.status')).toStrictEqual('OB');
        });
    });

    it('should allow to use startTLS', async () => {
        const previousVersion = await client.version();
        await client.startTLS({
            rejectUnauthorized: false
        });

        expect(client.client).toBeInstanceOf(TLSSocket);

        expect(await client.version()).toBe(previousVersion);
    });
});
