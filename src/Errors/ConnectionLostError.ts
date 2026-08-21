import { NUTProtocolError } from './NUTProtocolError.js';

export class ConnectionLostError extends NUTProtocolError {
    public constructor() {
        super('Connection to NUT server was lost');
        this.name = 'ConnectionLostError';
    }
}
