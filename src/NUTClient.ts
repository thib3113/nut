import { UPS } from './UPS.js';
import { RawNUTClient, UPSName } from './RawNUTClient.js';
import { parseLine, variableTypeConverter } from './utils.js';
import type { nutVariables, nutVariablesNames } from './NUTVariables.js';

export class NUTClient {
    private readonly client: RawNUTClient;
    constructor(host: string, port: number = 3493) {
        this.client = new RawNUTClient(host, port);
    }

    /**
     * allow to send custom command
     * @param cmd {string[]} the command to send
     * @param timeout {number} timeout for this command
     */
    async send(cmd: Array<string>, timeout?: number): ReturnType<RawNUTClient['send']> {
        return this.client.send(cmd, timeout);
    }

    /**
     * Allow to authenticate user on the UPS
     * @param username {string}
     * @param password {string}
     */
    async connect(username: string, password: string): ReturnType<RawNUTClient['connect']> {
        return this.client.connect(username, password);
    }

    /**
     * will log out and disconnect
     */
    async logout(): ReturnType<RawNUTClient['logout']> {
        return this.client.logout();
    }

    /**
     * allow to upgrade the connection with TLS
     *
     * @see {RawNUTClient.startTLS} to check the arguments allowed
     */
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
     * get help
     */
    async help(): ReturnType<RawNUTClient['help']> {
        return this.client.help();
    }
    /**
     * list all UPS
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
     * allow to select an UPS, and get an {@link UPS} object
     * @param name {string} name of the ups to search
     */
    async getUPS(name: string): Promise<UPS | undefined> {
        const ups = await this.listUPS();
        return ups.find((u) => u.name === name);
    }

    /**
     * List all the variables of the UPS
     * @param ups {string}
     */
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

    /**
     * list the available commands on the UPS
     * @param ups
     */
    async listCommands(ups: UPSName): ReturnType<RawNUTClient['listCommands']> {
        return this.client.listCommands(ups);
    }

    /**
     * get the description of a variable
     * @param ups
     * @param variable
     */
    async getVariableDescription(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableDescription']> {
        return this.client.getVariableDescription(ups, variable);
    }

    /**
     * get the type of variable ... Defined by the NUT driver, default to NUMBER
     * @param ups
     * @param variable
     */
    async getVariableType(ups: UPSName, variable: nutVariablesNames): Promise<ReturnType<typeof variableTypeConverter>> {
        return variableTypeConverter(await this.client.getVariableType(ups, variable));
    }

    /**
     * get the description of a command
     * @param ups
     * @param command
     */
    async getCommandDescription(ups: UPSName, command: string): ReturnType<RawNUTClient['getCommandDescription']> {
        return this.client.getCommandDescription(ups, command);
    }

    /**
     * get the enum variables
     * @param ups
     * @param variable
     */
    async getVariableEnum(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableEnum']> {
        return this.client.getVariableEnum(ups, variable);
    }

    /**
     * get the range of the variable
     * @param ups
     * @param variable
     */
    async getVariableRange(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariableRange']> {
        return this.client.getVariableRange(ups, variable);
    }

    /**
     * allow to set a variable
     * @param ups
     * @param variable
     * @param value
     */
    async setVariable(ups: UPSName, variable: nutVariablesNames, value: unknown): ReturnType<RawNUTClient['setVariable']> {
        return this.client.setVariable(ups, variable, value);
    }

    /**
     * allow to get a variable
     * @param ups
     * @param variable
     */
    async getVariable(ups: UPSName, variable: nutVariablesNames): ReturnType<RawNUTClient['getVariable']> {
        return this.client.getVariable(ups, variable);
    }

    /**
     * List the logged clients on the UPS
     * @param ups
     */
    async listClients(ups: UPSName): ReturnType<RawNUTClient['listClients']> {
        return this.client.listClients(ups);
    }

    /**
     * Allow to list variables
     * @param ups
     */
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

    /**
     * get number of clients logged (using LOGIN command)
     * @param ups
     */
    async getNumLogins(ups: UPSName): ReturnType<RawNUTClient['getNumLogins']> {
        return this.client.getNumLogins(ups);
    }
}
