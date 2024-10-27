export class ReadonlyError extends Error {
    public constructor() {
        super('The requested variable in a SET command is not writable.');
        Error.captureStackTrace(this, this.constructor);
    }
}
