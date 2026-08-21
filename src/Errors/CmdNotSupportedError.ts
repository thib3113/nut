import { NUTProtocolError } from './NUTProtocolError.js';

export class CmdNotSupportedError extends NUTProtocolError {
    public constructor() {
        super("The specified UPS doesn't support the instant command in the request.");
        this.name = 'CmdNotSupportedError';
    }
}
