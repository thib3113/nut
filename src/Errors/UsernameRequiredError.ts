export class UsernameRequiredError extends Error {
    public constructor() {
        super('The requested command requires a username for authentication, but the client hasn’t set one.');
        Error.captureStackTrace(this, this.constructor);
    }
}
