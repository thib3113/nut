export class UnknownError extends Error {
    public constructor(message: string) {
        super(`Unknown Error : ${message}`);
        Error.captureStackTrace(this, this.constructor);
    }
}
