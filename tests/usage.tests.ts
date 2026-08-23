import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NUTClient, RawNUTClient } from '../src/index.js';
import { setTimeout } from 'node:timers/promises';
import { Socket } from 'node:net';
import { TLSSocket } from 'node:tls';
import { setInterval } from 'node:timers/promises';

const testUPSName = 'dummyups';

describe('connection tests', () => {
    let client: RawNUTClient;

    afterEach(async () => {
        if ((client?.client as Socket)?.readyState != 'closed') {
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
        expect((client.client as Socket).readyState).toBe('closed');
        expect(client.connected).toBe(false);
    });

    describe('connection', () => {
        let client: RawNUTClient;
        beforeEach(async () => {
            client = new RawNUTClient('127.0.0.1', 3493);
        });

        afterEach(async () => {
            if ((client?.client as Socket)?.readyState != 'closed') {
                await client?.logout();
            }
        });

        it('should succeed with connection', async () => {
            await client.connect('user', 'secret');
            await client.runCommand(testUPSName, 'load.off');
        });

        it('should fail if invalid username', async () => {
            await client.connect('baduser', 'secret');
            await expect(() => client.runCommand(testUPSName, 'driver.reload')).rejects.toThrow(
                "The client's host and/or authentication details (username, password) are not sufficient to execute the requested command."
            );
        });

        it('should fail if invalid password', async () => {
            await client.connect('user', 'badsecret');
            await expect(() => client.runCommand(testUPSName, 'driver.reload')).rejects.toThrow(
                "The client's host and/or authentication details (username, password) are not sufficient to execute the requested command."
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
        if ((client?.client as Socket)?.readyState != 'closed') {
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
        expect(await client.netVersion()).toMatch(/\d+\.\d+/);
    });

    it('should show help', async () => {
        expect((await client.help()).startsWith('Commands: ')).toBeTruthy();
    });

    it('should list clients', async () => {
        await client.login(testUPSName);
        const clients = await client.listClients(testUPSName);
        expect(clients.length).toBe(1);
        //will match the current ip of the client
        expect(clients[0]).toMatch(/^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/);
    });

    it('should get num logins', async () => {
        await client.login(testUPSName);
        const clients = await client.getNumLogins(testUPSName);
        expect(clients).toBe(1);
    });

    describe('commands', () => {
        it('should list commands', async () => {
            expect(await client.listCommands(testUPSName)).toContain('load.off');
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
            // RawNUTClient returns the raw protocol value: the type, possibly with a max length suffix (STRING:32)
            expect(await client.getVariableType(testUPSName, 'device.mfr')).toMatch(/^STRING(:\d+)?$/);

            // NUTClient parses that suffix and exposes the max length: { type: 'STRING', maxLength: 32 }
            const nutClient = new NUTClient('127.0.0.1', 3493);
            await nutClient.connect('user', 'secret');
            const type = await nutClient.getVariableType(testUPSName, 'device.mfr');
            expect(type.type).toBe('STRING');
            expect(type.maxLength).toBeGreaterThan(0);
            await nutClient.logout();
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
            const result = await client.setVariable(testUPSName, 'ups.status', 'OB');
            expect(result).toBe('OK');

            //passing variable to driver can take time
            await setTimeout(2 * 1000);

            const status = await client.getVariable(testUPSName, 'ups.status');
            expect(status).toContain('OB');
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

    describe('new commands', () => {
        it('should get UPS description', async () => {
            const desc = await client.getUPSDescription(testUPSName);
            expect(desc).toBe('Dummy UPS for testing');
        });

        it('should run command with parameter', async () => {
            // load.off.delay accepts a delay parameter in seconds
            const result = await client.runCommand(testUPSName, 'load.off', '5');
            expect(result).toBe('OK');
        });

        it('should set and get tracking', async () => {
            // Enable tracking
            const setResult = await client.setTracking(true);
            // Server may return 'OK TRACKING' or just 'OK' depending on NUT version
            expect(['OK TRACKING', 'OK']).toContain(setResult);

            // Run a command with tracking enabled
            const cmdResult = await client.setVariable(testUPSName, 'ups.status', 'OL');

            // If tracking is supported, result contains UUID
            if (cmdResult.startsWith('OK TRACKING')) {
                const uuid = cmdResult.split(' ')[2];
                expect(uuid).toBeDefined();

                // Poll tracking status
                const trackingStatus = await client.getTracking(uuid);
                expect(['PENDING', 'SUCCESS']).toContain(trackingStatus);
            }

            // Disable tracking
            await client.setTracking(false);
        });

        it('should force shutdown (FSD)', async () => {
            // FSD requires master login
            await client.login(testUPSName);
            await client.master(testUPSName);

            const result = await client.forceShutdown(testUPSName);
            expect(result).toBe('OK FSD-SET');

            // Note: FSD sets a flag on the UPS, actual shutdown behavior depends on upsmon
            // Clean up: reset status to remove FSD flag
            await setTimeout(500);
            await client.setVariable(testUPSName, 'ups.status', 'OL');
        });
    });
});

describe('NUTClient integration tests', () => {
    let client: NUTClient;

    beforeEach(async () => {
        client = new NUTClient('127.0.0.1', 3493);
        await client.connect('user', 'secret');
    });

    afterEach(async () => {
        if (client.connected) {
            await client.logout();
        }

        const controller = new AbortController();

        for await (const _ of setInterval(10, null, {
            signal: controller.signal
        })) {
            if (!client.connected) {
                controller.abort();
                return;
            }
        }
    });

    it('should connect and show connected=true', () => {
        expect(client.connected).toBe(true);
    });

    it('should list UPS as UPS objects', async () => {
        const upsList = await client.listUPS();

        expect(upsList.length).toBe(1);
        expect(upsList[0].name).toBe(testUPSName);
        expect(upsList[0].description).toBe('Dummy UPS for testing');
    });

    it('should get UPS by name', async () => {
        const ups = await client.getUPS(testUPSName);

        expect(ups).toBeDefined();
        expect(ups!.name).toBe(testUPSName);
        expect(ups!.description).toBe('Dummy UPS for testing');
    });

    it('should list variables as parsed object', async () => {
        const variables = await client.listVariables(testUPSName);

        expect(variables).toBeTypeOf('object');
        expect(variables['device.mfr']).toBe('Dummy Manufacturer');
        expect(variables['device.model']).toBe('Dummy UPS');
        expect(variables['device.type']).toBe('ups');
    });

    it('should list writeable variables as parsed object', async () => {
        const variables = await client.listWriteableVariables(testUPSName);

        expect(variables).toBeTypeOf('object');
        expect(variables['ups.status']).toBeDefined();
        expect(typeof variables['ups.status']).toBe('string');
    });

    it('should get variable type as object', async () => {
        const type = await client.getVariableType(testUPSName, 'device.mfr');

        expect(type.type).toBe('STRING');
        expect(type.maxLength).toBeGreaterThan(0);
    });

    it('should get/set variables', async () => {
        // Ensure clean state (FSD flag may be set from previous tests)
        await client.setVariable(testUPSName, 'ups.status', 'OL');
        await setTimeout(500);

        expect(await client.getVariable(testUPSName, 'device.model')).toBe('Dummy UPS');

        const setResult = await client.setVariable(testUPSName, 'ups.status', 'OB');
        expect(setResult).toStrictEqual({ tracked: false, success: true });

        // passing variable to driver can take time
        await setTimeout(2 * 1000);

        const status = await client.getVariable(testUPSName, 'ups.status');
        expect(status).toContain('OB');

        // restore original value
        await client.setVariable(testUPSName, 'ups.status', 'OL');
    });

    it('should support startTLS', async () => {
        const previousVersion = await client.version();
        await client.startTLS({
            rejectUnauthorized: false
        });

        expect(await client.version()).toBe(previousVersion);
    });

    describe('new commands', () => {
        it('should get UPS description', async () => {
            const desc = await client.getUPSDescription(testUPSName);
            expect(desc).toBe('Dummy UPS for testing');
        });

        it('should run command with parameter', async () => {
            const result = await client.runCommand(testUPSName, 'load.off', '5');
            expect(result).toEqual({ tracked: false, success: true });
        });

        it('should set and get tracking', async () => {
            await client.setTracking(true);

            const cmdResult = await client.setVariable(testUPSName, 'ups.status', 'OL');

            // If tracking is supported, result contains UUID
            if (cmdResult.tracked && 'trackingUid' in cmdResult) {
                const uuid = cmdResult.trackingUid;
                expect(uuid).toBeDefined();

                const trackingStatus = await client.getTracking(uuid);
                expect(['PENDING', 'SUCCESS']).toContain(trackingStatus);
            }

            await client.setTracking(false);
        });

        it('should force shutdown (FSD)', async () => {
            await client.login(testUPSName);
            await client.master(testUPSName);

            const result = await client.forceShutdown(testUPSName);
            expect(result).toBe('OK FSD-SET');

            // Clean up: reset status to remove FSD flag
            await setTimeout(500);
            await client.setVariable(testUPSName, 'ups.status', 'OL');
        });
    });

    it('NUTClient.create() should connect with credentials', async () => {
        const created = await NUTClient.create('127.0.0.1', 3493, {
            username: 'user',
            password: 'secret'
        });

        expect(created.connected).toBe(true);

        const upsList = await created.listUPS();
        expect(upsList.length).toBe(1);
        expect(upsList[0].name).toBe(testUPSName);

        await created.logout();
    });

    it('should logout and show connected=false', async () => {
        expect(client.connected).toBe(true);
        await client.logout();

        await setTimeout(10);
        expect(client.connected).toBe(false);
    });
});
