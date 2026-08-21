import { NUTProtocolError } from './NUTProtocolError.js';

export class AlreadySetUsernameError extends NUTProtocolError {
    public constructor() {
        super("The client has already set a USERNAME, and can't set another. This should never happen with normal NUT clients.");
        this.name = 'AlreadySetUsernameError';
    }
}
