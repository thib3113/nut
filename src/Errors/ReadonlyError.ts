import { NUTProtocolError } from './NUTProtocolError.js';

export class ReadonlyError extends NUTProtocolError {
    public constructor() {
        super('The requested variable in a SET command is not writable.');
        this.name = 'ReadonlyError';
    }
}
