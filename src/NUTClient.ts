import { UPS } from './UPS.js';
import { RawNUTClient, UPSName } from './RawNUTClient.js';
import { parseLine, variableTypeConverter } from './utils.js';
import type { nutVariables, nutVariablesNames } from './NUTVariables.js';

export class NUTClient {
    private client: RawNUTClient;
    constructor(host: string, port: number = 3493) {
        this.client = new RawNUTClient(host, port);
    }

    /**
     * allow to send custom command
     * @param cmd
     * @param timeout
     */
    async send(cmd: Array<string>, timeout?: number): ReturnType<RawNUTClient['send']> {
        return this.client.send(cmd, timeout);
    }

    async connect(username: string, password: string): ReturnType<RawNUTClient['connect']> {
        return this.client.connect(username, password);
    }

    async logout(): ReturnType<RawNUTClient['logout']> {
        return this.client.logout();
    }

    async startTLS(...args: Parameters<RawNUTClient['startTLS']>): ReturnType<RawNUTClient['startTLS']> {
        return this.client.startTLS(...args);
    }

    /**
     * get server version
     */
    async version(): ReturnType<RawNUTClient['version']> {
        return this.client.version();
    }

    /**
     * get network protocol version
     */
    async netVersion(): ReturnType<RawNUTClient['netVersion']> {
        return this.client.netVersion();
    }
    /**
     * get network protocol version
     */
    async help(): ReturnType<RawNUTClient['help']> {
        return this.client.help();
    }
    /**
     * get all UPS
     */
    async listUPS(): Promise<Array<UPS>> {
        return this.client.listUPS().then((res) =>
            res.map((l) => {
                const parts = parseLine(l);

                return new UPS(this, parts[0], parts[1] ?? '');
            })
        );
    }

    /**
     * get a UPS by name
     * @param name
     */
    async getUPS(name: string): Promise<UPS | undefined> {
        const ups = await this.listUPS();
        return ups.find((u) => u.name === name);
    }

    async listVariables(ups: UPSName): Promise<nutVariables> {
        return this.client.listVariables(ups).then((res) =>
            Object.fromEntries(
                res.map((line) => {
                    const [key, value] = parseLine(line) as [nutVariables, string];

                    if (!key) {
                        throw new Error('fail to get key from variables');
                    }

                    return [key, value ?? ''];
                })
            )
        );
    }

    async listCommands(ups: UPSName): ReturnType<RawNUTClient['listCommands']> {
        return this.client.listCommands(ups);
    }

    async getVariableDescription(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableDescription']> {
        return this.client.getVariableDescription(ups, variable);
    }

    async getVariableType(ups: UPSName, variable: nutVariablesNames): Promise<ReturnType<typeof variableTypeConverter>> {
        return variableTypeConverter(await this.client.getVariableType(ups, variable));
    }

    async getCommandDescription(ups: UPSName, command: string): ReturnType<RawNUTClient['getCommandDescription']> {
        return this.client.getCommandDescription(ups, command);
    }

    async getVariableEnum(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableEnum']> {
        return this.client.getVariableEnum(ups, variable);
    }

    async getVariableRange(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableRange']> {
        return this.client.getVariableRange(ups, variable);
    }

    async setVariable(ups: UPSName, variable: nutVariablesNames, value: unknown): ReturnType<RawNUTClient['setVariable']> {
        return this.client.setVariable(ups, variable, value);
    }

    async getVariable(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariable']> {
        return this.client.getVariable(ups, variable);
    }

    async listClients(ups: UPSName): ReturnType<RawNUTClient['listClients']> {
        return this.client.listClients(ups);
    }

    async listWriteableVariables(ups: UPSName): Promise<Record<string, string>> {
        return this.client.listWriteableVariables(ups).then((res) =>
            Object.fromEntries(
                res.map((line) => {
                    const [key, value] = parseLine(line);

                    if (!key) {
                        throw new Error('fail to get key from variables');
                    }

                    return [key, value ?? ''];
                })
            )
        );
    }

    async getNumLogins(ups: UPSName): ReturnType<RawNUTClient['getNumLogins']> {
        return this.client.getNumLogins(ups);
    }
}
