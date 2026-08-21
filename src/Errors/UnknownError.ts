import { NUTProtocolError } from './NUTProtocolError.js';

export class UnknownError extends NUTProtocolError {
    public constructor(message: string) {
        super(`Unknown Error : ${message}`);
        this.name = 'UnknownError';
    }
}
