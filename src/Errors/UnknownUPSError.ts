export class UnknownUPSError extends Error {
    public constructor() {
        super('The UPS specified in the request is not known to upsd. This usually means that it didn’t match anything in ups.conf.');
        Error.captureStackTrace(this, this.constructor);
    }
}
