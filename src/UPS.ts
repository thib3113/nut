import type { NUTClient } from './NUTClient.js';
import { nutVariablesNames } from './NUTVariables.js';

export class UPS {
    constructor(
        private readonly client: NUTClient,
        public readonly name: string,
        public readonly description: string
    ) {
        if (!this.name) {
            throw new Error('fail to init UPS');
        }
    }

    async listVariables(): ReturnType<NUTClient['listVariables']> {
        return this.client.listVariables(this.name);
    }

    async listCommands(): ReturnType<NUTClient['listCommands']> {
        return this.client.listCommands(this.name);
    }

    async getVariableType(variable: nutVariablesNames): ReturnType<NUTClient['getVariableType']> {
        return this.client.getVariableType(this.name, variable);
    }

    async getVariableDescription(variable: nutVariablesNames): ReturnType<NUTClient['getVariableDescription']> {
        return this.client.getVariableDescription(this.name, variable);
    }

    async getVariableEnum(variable: nutVariablesNames): ReturnType<NUTClient['getVariableEnum']> {
        return this.client.getVariableEnum(this.name, variable);
    }

    async getVariableRange(variable: nutVariablesNames): ReturnType<NUTClient['getVariableRange']> {
        return this.client.getVariableRange(this.name, variable);
    }

    async setVariable(variable: nutVariablesNames, value: unknown): ReturnType<NUTClient['setVariable']> {
        return this.client.setVariable(this.name, variable, value);
    }

    async getVariable(variable: nutVariablesNames): ReturnType<NUTClient['getVariable']> {
        return this.client.getVariable(this.name, variable);
    }

    async getCommandDescription(command: string): ReturnType<NUTClient['getCommandDescription']> {
        return this.client.getCommandDescription(this.name, command);
    }

    async listClients(): ReturnType<NUTClient['listClients']> {
        return this.client.listClients(this.name);
    }

    async listWriteableVariables(): ReturnType<NUTClient['listWriteableVariables']> {
        return this.client.listWriteableVariables(this.name);
    }
    async getNumLogins(): ReturnType<NUTClient['getNumLogins']> {
        return this.client.getNumLogins(this.name);
    }

    /**
     * @inheritDoc NUTClient.login
     */
    async login(): ReturnType<NUTClient['login']> {
        return this.client.login(this.name);
    }
}
