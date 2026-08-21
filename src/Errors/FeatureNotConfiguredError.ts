import { NUTProtocolError } from './NUTProtocolError.js';

export class FeatureNotConfiguredError extends NUTProtocolError {
    public constructor() {
        super(
            "This instance of upsd hasn't been configured properly to allow the requested feature to operate. This is also limited to STARTTLS for now."
        );
        this.name = 'FeatureNotConfiguredError';
    }
}
