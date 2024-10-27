export class AccessDeniedError extends Error {
    public constructor() {
        super('The client’s host and/or authentication details (username, password) are not sufficient to execute the requested command.');
        Error.captureStackTrace(this, this.constructor);
    }
}
