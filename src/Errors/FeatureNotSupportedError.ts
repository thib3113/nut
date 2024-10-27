export class FeatureNotSupportedError extends Error {
    public constructor() {
        super('This instance of upsd does not support the requested feature. This is only used for TLS/SSL mode (STARTTLS) at the moment.');
        Error.captureStackTrace(this, this.constructor);
    }
}
