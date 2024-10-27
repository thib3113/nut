export class AlreadySSLModeError extends Error {
    public constructor() {
        super('TLS/SSL mode is already enabled on this connection, so upsd can’t start it again.');
        Error.captureStackTrace(this, this.constructor);
    }
}
