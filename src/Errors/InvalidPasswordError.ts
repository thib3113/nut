export class InvalidPasswordError extends Error {
    public constructor() {
        super('The client sent an invalid PASSWORD . perhaps an empty one.');
        Error.captureStackTrace(this, this.constructor);
    }
}
