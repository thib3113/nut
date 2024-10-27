export class AlreadySetUsernameError extends Error {
    public constructor() {
        super('The client has already set a USERNAME, and can’t set another. This should never happen with normal NUT clients.');
        Error.captureStackTrace(this, this.constructor);
    }
}
