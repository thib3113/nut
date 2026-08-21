import { NUTProtocolError } from './NUTProtocolError.js';

export class AlreadySetPasswordError extends NUTProtocolError {
    public constructor() {
        super("The client already set a PASSWORD and can't set another. This also should never happen with normal NUT clients.");
        this.name = 'AlreadySetPasswordError';
    }
}
