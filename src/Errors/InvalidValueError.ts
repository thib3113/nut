export class InvalidValueError extends Error {
    public constructor() {
        super(
            'The value specified in the request is not valid. This usually applies to a SET of an ENUM type which is using a value which is not in the list of allowed values.'
        );
        Error.captureStackTrace(this, this.constructor);
    }
}
