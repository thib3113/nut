export class DriverNotConnectedError extends Error {
    public constructor() {
        super(
            'upsd can’t perform the requested command, since the driver for that UPS is not connected. This usually means that the driver is not running, or if it is, the ups.conf is misconfigured.'
        );
        Error.captureStackTrace(this, this.constructor);
    }
}
