export class SetFailedError extends Error {
    public constructor() {
        super('upsd failed to deliver the set request to the driver. This is just like INSTCMD-FAILED above.');
        Error.captureStackTrace(this, this.constructor);
    }
}
