import { NUTProtocolError } from './NUTProtocolError.js';

export class AlreadySSLModeError extends NUTProtocolError {
    public constructor() {
        super("TLS/SSL mode is already enabled on this connection, so upsd can't start it again.");
        this.name = 'AlreadySSLModeError';
    }
}
