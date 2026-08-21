import { NUTProtocolError } from './NUTProtocolError.js';

export class DataStaleError extends NUTProtocolError {
    public constructor() {
        super(
            "upsd is connected to the driver for the UPS, but that driver isn't providing regular updates or has specifically marked the data as stale. upsd refuses to provide variables on stale units to avoid false readings. This generally means that the driver is running, but it has lost communications with the hardware. Check the physical connection to the equipment."
        );
        this.name = 'DataStaleError';
    }
}
