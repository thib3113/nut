/**
 * current battery status
 */
export enum ENUTStatus {
    /**
     * ON LINE
     */
    OL = 'OL',
    /**
     * ON BATTERY
     */
    OB = 'OB',
    /**
     * REPLACE BATTERY
     */
    RB = 'RB',
    /**
     * LOW_BATTERY
     */
    LB = 'LB',
    /**
     * HIGH BATTERY
     */
    HB = 'HB',
    /**
     * FORCED SHUTDOWN
     */
    FSD = 'FSD',
    /**
     * CALIBRATION
     */
    CAL = 'CAL',
    /**
     * OFF
     */
    OFF = 'OFF',
    /**
     * BYPASS mode
     */
    BYPASS = 'BYPASS',
    /**
     * CHARGING
     */
    CHRG = 'CHRG',
    /**
     * DISCHARGING
     */
    DISCHRG = 'DISCHRG',
    /**
     * TRIMMING voltage (input voltage too high)
     */
    TRIM = 'TRIM',
    /**
     * BOOSTING voltage (input voltage too low)
     */
    BOOST = 'BOOST',
    /**
     * OVERLOADED
     */
    OVER = 'OVER'
}
