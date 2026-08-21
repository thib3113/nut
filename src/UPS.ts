import { ENUTStatus } from './ENUTStatus.js';
import { VarNotSupportedError } from './Errors/index.js';
import type { NUTClient } from './NUTClient.js';
import { nutVariablesNames } from './NUTVariables.js';

export class UPS {
    #client: NUTClient;

    constructor(
        client: NUTClient,
        public readonly name: string,
        public readonly description: string
    ) {
        this.#client = client;
        if (!this.name) {
            throw new Error('fail to init UPS');
        }
    }

    async listVariables(): ReturnType<NUTClient['listVariables']> {
        return this.#client.listVariables(this.name);
    }

    async listCommands(): ReturnType<NUTClient['listCommands']> {
        return this.#client.listCommands(this.name);
    }

    async getVariableType(variable: nutVariablesNames): ReturnType<NUTClient['getVariableType']> {
        return this.#client.getVariableType(this.name, variable);
    }

    async getVariableDescription(variable: nutVariablesNames): ReturnType<NUTClient['getVariableDescription']> {
        return this.#client.getVariableDescription(this.name, variable);
    }

    async getVariableEnum(variable: nutVariablesNames): ReturnType<NUTClient['getVariableEnum']> {
        return this.#client.getVariableEnum(this.name, variable);
    }

    async getVariableRange(variable: nutVariablesNames): ReturnType<NUTClient['getVariableRange']> {
        return this.#client.getVariableRange(this.name, variable);
    }

    async setVariable(variable: nutVariablesNames, value: unknown): ReturnType<NUTClient['setVariable']> {
        return this.#client.setVariable(this.name, variable, value);
    }

    async getVariable(variable: nutVariablesNames): ReturnType<NUTClient['getVariable']> {
        return this.#client.getVariable(this.name, variable);
    }

    async getCommandDescription(command: string): ReturnType<NUTClient['getCommandDescription']> {
        return this.#client.getCommandDescription(this.name, command);
    }

    async runCommand(command: string): ReturnType<NUTClient['runCommand']> {
        return this.#client.runCommand(this.name, command);
    }

    async listClients(): ReturnType<NUTClient['listClients']> {
        return this.#client.listClients(this.name);
    }

    async listWriteableVariables(): ReturnType<NUTClient['listWriteableVariables']> {
        return this.#client.listWriteableVariables(this.name);
    }
    async getNumLogins(): ReturnType<NUTClient['getNumLogins']> {
        return this.#client.getNumLogins(this.name);
    }

    /**
     * @inheritDoc NUTClient.login
     */
    async login(): ReturnType<NUTClient['login']> {
        return this.#client.login(this.name);
    }

    /**
     * @inheritDoc NUTClient.master
     */
    async master(): ReturnType<NUTClient['master']> {
        return this.#client.master(this.name);
    }

    /**
     * Check if this client is master for the UPS
     */
    async getMaster(): ReturnType<NUTClient['getMaster']> {
        return this.#client.getMaster(this.name);
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    async #getFloatVariable(variable: nutVariablesNames): Promise<number> {
        try {
            const raw = await this.#client.getVariable(this.name, variable);
            return parseFloat(raw);
        } catch (e) {
            if (e instanceof VarNotSupportedError) return NaN;
            throw e;
        }
    }

    async #getStringVariable(variable: nutVariablesNames): Promise<string> {
        try {
            return await this.#client.getVariable(this.name, variable);
        } catch (e) {
            if (e instanceof VarNotSupportedError) return '';
            throw e;
        }
    }

    // ─── Convenience methods ───────────────────────────────────────────────

    /**
     * Get the current UPS status as an array of ENUTStatus.
     * The `ups.status` variable can contain multiple space-separated status codes (e.g., "OL CHRG").
     * Returns an empty array if the variable is not supported by the UPS.
     */
    async getStatus(): Promise<ENUTStatus[]> {
        try {
            const raw = await this.#client.getVariable(this.name, 'ups.status');
            return raw.split(/\s+/).filter((s): s is ENUTStatus => s.length > 0 && Object.values<string>(ENUTStatus).includes(s));
        } catch (e) {
            if (e instanceof VarNotSupportedError) {
                return [];
            }
            throw e;
        }
    }

    /**
     * Check if UPS is on battery power.
     */
    async isOnBattery(): Promise<boolean> {
        const statuses = await this.getStatus();
        return statuses.includes(ENUTStatus.OB);
    }

    /**
     * Check if UPS is online (mains power).
     */
    async isOnline(): Promise<boolean> {
        const statuses = await this.getStatus();
        return statuses.includes(ENUTStatus.OL);
    }

    /**
     * Get battery charge percentage (0-100).
     * Returns NaN if the variable is not supported by the UPS or not a valid number.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getBatteryCharge(): Promise<number> {
        return this.#getFloatVariable('battery.charge');
    }

    /**
     * Get battery runtime in seconds.
     * Returns NaN if the variable is not supported by the UPS or not a valid number.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getBatteryRuntime(): Promise<number> {
        return this.#getFloatVariable('battery.runtime');
    }

    /**
     * Get UPS load percentage (0-100).
     * Returns NaN if the variable is not supported by the UPS or not a valid number.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getLoad(): Promise<number> {
        return this.#getFloatVariable('ups.load');
    }

    /**
     * Get input voltage.
     * Returns NaN if the variable is not supported by the UPS or not a valid number.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getInputVoltage(): Promise<number> {
        return this.#getFloatVariable('input.voltage');
    }

    /**
     * Get output voltage.
     * Returns NaN if the variable is not supported by the UPS or not a valid number.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getOutputVoltage(): Promise<number> {
        return this.#getFloatVariable('output.voltage');
    }

    /**
     * Get UPS model name.
     * Returns empty string if the variable is not supported by the UPS.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getModel(): Promise<string> {
        return this.#getStringVariable('ups.model');
    }

    /**
     * Get UPS manufacturer.
     * Returns empty string if the variable is not supported by the UPS.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getManufacturer(): Promise<string> {
        return this.#getStringVariable('ups.mfr');
    }

    /**
     * Get UPS serial number.
     * Returns empty string if the variable is not supported by the UPS.
     * Throws on other errors (connection errors, access denied, etc.).
     */
    async getSerial(): Promise<string> {
        return this.#getStringVariable('ups.serial');
    }
}
