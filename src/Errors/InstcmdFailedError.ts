import { NUTProtocolError } from './NUTProtocolError.js';

export class InstcmdFailedError extends NUTProtocolError {
    public constructor() {
        super(
            'upsd failed to deliver the instant command request to the driver. No further information is available to the client. This typically indicates a dead or broken driver.'
        );
        this.name = 'InstcmdFailedError';
    }
}
