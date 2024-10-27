export class InvalidArgumentError extends Error {
    public constructor() {
        super(
            'The client sent an argument to a command which is not recognized or is otherwise invalid in this context. This is typically caused by sending a valid command like GET with an invalid subcommand.'
        );
        Error.captureStackTrace(this, this.constructor);
    }
}
