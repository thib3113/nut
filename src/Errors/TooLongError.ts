export class TooLongError extends Error {
    public constructor() {
        super('The requested value in a SET command is too long.');
        Error.captureStackTrace(this, this.constructor);
    }
}
