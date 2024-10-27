export class PasswordRequiredError extends Error {
    public constructor() {
        super('The requested command requires a passname for authentication, but the client hasn’t set one.');
        Error.captureStackTrace(this, this.constructor);
    }
}
