export class VarNotSupportedError extends Error {
    public constructor() {
        super(
            'The specified UPS doesn’t support the variable in the request. This is also sent for unrecognized variables which are in a space which is handled by upsd, such as server.*.'
        );
        Error.captureStackTrace(this, this.constructor);
    }
}
