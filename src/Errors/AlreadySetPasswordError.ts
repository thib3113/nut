export class AlreadySetPasswordError extends Error {
    public constructor() {
        super('The client already set a PASSWORD and can’t set another. This also should never happen with normal NUT clients.');
        Error.captureStackTrace(this, this.constructor);
    }
}
