import { NUTProtocolError } from './NUTProtocolError.js';

export class UsernameRequiredError extends NUTProtocolError {
    public constructor() {
        super("The requested command requires a username for authentication, but the client hasn't set one.");
        this.name = 'UsernameRequiredError';
    }
}
