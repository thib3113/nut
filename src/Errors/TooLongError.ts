import { NUTProtocolError } from './NUTProtocolError.js';

export class TooLongError extends NUTProtocolError {
    public constructor() {
        super('The requested value in a SET command is too long.');
        this.name = 'TooLongError';
    }
}
