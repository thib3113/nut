export class NUTProtocolError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'NUTProtocolError';
        Error.captureStackTrace(this, this.constructor);
    }
}
