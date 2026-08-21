import { NUTProtocolError } from './NUTProtocolError.js';

export class InvalidPasswordError extends NUTProtocolError {
    public constructor() {
        super('The client sent an invalid PASSWORD . perhaps an empty one.');
        this.name = 'InvalidPasswordError';
    }
}
