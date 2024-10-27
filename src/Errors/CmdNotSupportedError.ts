export class CmdNotSupportedError extends Error {
    public constructor() {
        super('The specified UPS doesn’t support the instant command in the request.');
        Error.captureStackTrace(this, this.constructor);
    }
}
