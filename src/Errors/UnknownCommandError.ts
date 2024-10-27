export class UnknownCommandError extends Error {
    public constructor() {
        super('upsd doesn’t recognize the requested command.');
        Error.captureStackTrace(this, this.constructor);
    }
}
