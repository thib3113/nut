import { NUTProtocolError } from './NUTProtocolError.js';

export class AccessDeniedError extends NUTProtocolError {
    public constructor() {
        super("The client's host and/or authentication details (username, password) are not sufficient to execute the requested command.");
        this.name = 'AccessDeniedError';
    }
}
