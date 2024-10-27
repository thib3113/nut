export class AlreadyLoggedInError extends Error {
    public constructor() {
        super(
            'The client already sent LOGIN for a UPS and can’t do it again. There is presently a limit of one LOGIN record per connection.'
        );
        Error.captureStackTrace(this, this.constructor);
    }
}
