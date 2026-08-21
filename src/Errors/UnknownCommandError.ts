import { NUTProtocolError } from './NUTProtocolError.js';

export class UnknownCommandError extends NUTProtocolError {
    public constructor() {
        super("upsd doesn't recognize the requested command.");
        this.name = 'UnknownCommandError';
    }
}
