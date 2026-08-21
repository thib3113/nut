import { NUTProtocolError } from './NUTProtocolError.js';

export class InvalidUsernameError extends NUTProtocolError {
    public constructor() {
        super('The client sent an invalid USERNAME.');
        this.name = 'InvalidUsernameError';
    }
}
