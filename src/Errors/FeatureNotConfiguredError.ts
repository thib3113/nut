export class FeatureNotConfiguredError extends Error {
    public constructor() {
        super(
            'This instance of upsd hasn’t been configured properly to allow the requested feature to operate. This is also limited to STARTTLS for now.'
        );
        Error.captureStackTrace(this, this.constructor);
    }
}
