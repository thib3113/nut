import { NUTProtocolError } from './NUTProtocolError.js';

export class AlreadyLoggedInError extends NUTProtocolError {
    public constructor() {
        super(
            "The client already sent LOGIN for a UPS and can't do it again. There is presently a limit of one LOGIN record per connection."
        );
        this.name = 'AlreadyLoggedInError';
    }
}
