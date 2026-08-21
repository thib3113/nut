import { NUTProtocolError } from './NUTProtocolError.js';

export class FeatureNotSupportedError extends NUTProtocolError {
    public constructor() {
        super('This instance of upsd does not support the requested feature. This is only used for TLS/SSL mode (STARTTLS) at the moment.');
        this.name = 'FeatureNotSupportedError';
    }
}
