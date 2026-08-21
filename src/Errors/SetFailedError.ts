import { NUTProtocolError } from './NUTProtocolError.js';

export class SetFailedError extends NUTProtocolError {
    public constructor() {
        super('upsd failed to deliver the set request to the driver. This is just like INSTCMD-FAILED above.');
        this.name = 'SetFailedError';
    }
}
