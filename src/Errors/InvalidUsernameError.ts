export class InvalidUsernameError extends Error {
    public constructor() {
        super('The client sent an invalid USERNAME.');
        Error.captureStackTrace(this, this.constructor);
    }
}
