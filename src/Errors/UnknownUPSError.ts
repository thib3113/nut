import { NUTProtocolError } from './NUTProtocolError.js';

export class UnknownUPSError extends NUTProtocolError {
    public constructor() {
        super("The UPS specified in the request is not known to upsd. This usually means that it didn't match anything in ups.conf.");
        this.name = 'UnknownUPSError';
    }
}
