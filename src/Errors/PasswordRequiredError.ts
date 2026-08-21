import { NUTProtocolError } from './NUTProtocolError.js';

export class PasswordRequiredError extends NUTProtocolError {
    public constructor() {
        super("The requested command requires a passname for authentication, but the client hasn't set one.");
        this.name = 'PasswordRequiredError';
    }
}
