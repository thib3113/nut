// read more here https://networkupstools.org/docs/developer-guide.chunked/apas02.html
export type deviceVariables =
    /**
     * Device model
     */
    | 'device.model'
    /**
     * Device manufacturer
     */
    | 'device.mfr'
    /**
     * Device serial number (opaque string)
     */
    | 'device.serial'
    /**
     * Device type (ups, pdu, scd, psu, ats)
     */
    | 'device.type'
    /**
     * Device description (opaque string)
     */
    | 'device.description'
    /**
     * Device administrator name (opaque string)
     */
    | 'device.contact'
    /**
     * Device physical location (opaque string)
     */
    | 'device.location'
    /**
     * Device part number (opaque string)
     */
    | 'device.part'
    /**
     * Physical network address of the device
     */
    | 'device.macaddr'
    /**
     * Device uptime in seconds
     */
    | 'device.uptime'
    /**
     * Total number of daisychained devices
     */
    | 'device.count';

/***
 * will be removed in the future of nut https://networkupstools.org/docs/developer-guide.chunked/apas02.html
 */
export type upsVariables =
    /**
     * UPS status
     */
    | 'ups.status'
    /**
     * UPS alarms
     */
    | 'ups.alarm'
    /**
     * Internal UPS clock time (opaque string)
     */
    | 'ups.time'
    /**
     * Internal UPS clock date (opaque string)
     */
    | 'ups.date'
    /**
     * UPS model
     */
    | 'ups.model'
    /**
     * UPS manufacturer
     */
    | 'ups.mfr'
    /**
     * UPS manufacturing date (opaque string)
     */
    | 'ups.mfr.date'
    /**
     * UPS serial number (opaque  string)
     */
    | 'ups.serial'
    /**
     * Vendor ID for USB devices
     */
    | 'ups.vendorid'
    /**
     * Product ID for USB devices
     */
    | 'ups.productid'
    /**
     * UPS firmware (opaque string)
     */
    | 'ups.firmware'
    /**
     * Auxiliary device firmware
     */
    | 'ups.firmware.aux'
    /**
     * UPS temperature (degrees C)
     */
    | 'ups.temperature'
    /**
     * Load on UPS (percent)
     */
    | 'ups.load'
    /**
     * Load when UPS  switches to overload  condition (\"OVER\") (percent)
     */
    | 'ups.load.high'
    /**
     * UPS system identifier (opaque string)
     */
    | 'ups.id'
    /**
     * Interval to wait before  restarting the load (seconds)
     */
    | 'ups.delay.start'
    /**
     * Interval to wait before  rebooting the UPS (seconds)
     */
    | 'ups.delay.reboot'
    /**
     * Interval to wait after  shutdown with delay command (seconds)
     */
    | 'ups.delay.shutdown'
    /**
     * Time before the load will be  started (seconds)
     */
    | 'ups.timer.start'
    /**
     * Time before the load will be  rebooted (seconds)
     */
    | 'ups.timer.reboot'
    /**
     * Time before the load will be  shutdown (seconds)
     */
    | 'ups.timer.shutdown'
    /**
     * Interval between self tests (seconds)
     */
    | 'ups.test.interval'
    /**
     * Results of last self test (opaque string)
     */
    | 'ups.test.result'
    /**
     * Date of last self test (opaque string)
     */
    | 'ups.test.date'
    /**
     * Language to use on front  panel (* opaque)
     */
    | 'ups.display.language'
    /**
     * UPS external contact sensors  (* opaque)
     */
    | 'ups.contacts'
    /**
     * Efficiency of the UPS (ratio  of the output current on the  input current) (percent)
     */
    | 'ups.efficiency'
    /**
     * Current value of apparent  power (Volt-Amps)
     */
    | 'ups.power'
    /**
     * Nominal value of apparent  power (Volt-Amps)
     */
    | 'ups.power.nominal'
    /**
     * Current value of real  power (Watts)
     */
    | 'ups.realpower'
    /**
     * Nominal value of real  power (Watts)
     */
    | 'ups.realpower.nominal'
    /**
     * UPS beeper status (enabled, disabled or muted)
     */
    | 'ups.beeper.status'
    /**
     * UPS type (* opaque)
     */
    | 'ups.type'
    /**
     * UPS watchdog status (enabled or disabled)
     */
    | 'ups.watchdog.status'
    /**
     * UPS starts when mains is (re)applied
     */
    | 'ups.start.auto'
    /**
     * Allow to start UPS from  battery
     */
    | 'ups.start.battery'
    /**
     * UPS coldstarts from battery (enabled or disabled)
     */
    | 'ups.start.reboot'
    /**
     * Enable or disable UPS  shutdown ability (poweroff)
     */
    | 'ups.shutdown';

export type inputVariables =
    /**
     * Input voltage (V)
     */
    | 'input.voltage'
    /**
     * Maximum incoming voltage seen (V)
     */
    | 'input.voltage.maximum'
    /**
     * Minimum incoming voltage seen (V)
     */
    | 'input.voltage.minimum'
    /**
     * Status relative to the  thresholds
     */
    | 'input.voltage.status'
    /**
     * Low warning threshold (V)
     */
    | 'input.voltage.low.warning'
    /**
     * Low critical threshold (V)
     */
    | 'input.voltage.low.critical'
    /**
     * High warning threshold (V)
     */
    | 'input.voltage.high.warning'
    /**
     * High critical threshold (V)
     */
    | 'input.voltage.high.critical'
    /**
     * Nominal input voltage (V)
     */
    | 'input.voltage.nominal'
    /**
     * Extended input voltage range
     */
    | 'input.voltage.extended'
    /**
     * Delay before transfer to mains (seconds)
     */
    | 'input.transfer.delay'
    /**
     * Reason for last transfer  to battery (* opaque)
     */
    | 'input.transfer.reason'
    /**
     * Low voltage transfer point (V)
     */
    | 'input.transfer.low'
    /**
     * High voltage transfer point (V)
     */
    | 'input.transfer.high'
    /**
     * smallest settable low voltage transfer point (V)
     */
    | 'input.transfer.low.min'
    /**
     * greatest settable low  voltage transfer point (V)
     */
    | 'input.transfer.low.max'
    /**
     * smallest settable high  voltage transfer point (V)
     */
    | 'input.transfer.high.min'
    /**
     * greatest settable high  voltage transfer point (V)
     */
    | 'input.transfer.high.max'
    /**
     * Input power sensitivity
     */
    | 'input.sensitivity'
    /**
     * Input power quality (*  opaque)
     */
    | 'input.quality'
    /**
     * Input current (A)
     */
    | 'input.current'
    /**
     * Nominal input current (A)
     */
    | 'input.current.nominal'
    /**
     * Status relative to the  thresholds
     */
    | 'input.current.status'
    /**
     * Low warning threshold (A)
     */
    | 'input.current.low.warning'
    /**
     * Low critical threshold (A)
     */
    | 'input.current.low.critical'
    /**
     * High warning threshold (A)
     */
    | 'input.current.high.warning'
    /**
     * High critical threshold (A)
     */
    | 'input.current.high.critical'
    /**
     * Color of the input feed (opaque string)
     */
    | 'input.feed.color'
    /**
     * Description of the input feed
     */
    | 'input.feed.desc'
    /**
     * Input line frequency (Hz)
     */
    | 'input.frequency'
    /**
     * Nominal input line  frequency (Hz)
     */
    | 'input.frequency.nominal'
    /**
     * Frequency status
     */
    | 'input.frequency.status'
    /**
     * Input line frequency low (Hz)
     */
    | 'input.frequency.low'
    /**
     * Input line frequency high (Hz)
     */
    | 'input.frequency.high'
    /**
     * Extended input frequency range
     */
    | 'input.frequency.extended'
    /**
     * Low voltage boosting  transfer point (V)
     */
    | 'input.transfer.boost.low'
    /**
     * High voltage boosting  transfer point (V)
     */
    | 'input.transfer.boost.high'
    /**
     * Low voltage trimming  transfer point (V)
     */
    | 'input.transfer.trim.low'
    /**
     * High voltage trimming  transfer point (V)
     */
    | 'input.transfer.trim.high'
    /**
     * Low voltage ECO  transfer point (V)
     */
    | 'input.transfer.eco.low'
    /**
     * Low voltage Bypass  transfer point (V)
     */
    | 'input.transfer.bypass.low'
    /**
     * High voltage ECO  transfer point (V)
     */
    | 'input.transfer.eco.high'
    /**
     * High voltage Bypass  transfer point (V)
     */
    | 'input.transfer.bypass.high'
    /**
     * Frequency range Bypass transfer  point (percent of nominal Hz)
     */
    | 'input.transfer.frequency.bypass.range'
    /**
     * Frequency range ECO transfer  point (percent of nominal Hz)
     */
    | 'input.transfer.frequency.eco.range'
    /**
     * Threshold of switching protection modes,  voltage transfer point (V)
     */
    | 'input.transfer.hysteresis'
    /**
     * Load on (ePDU) input (percent  of full)
     */
    | 'input.load'
    /**
     * Current sum value of all (ePDU)  phases real power (W)
     */
    | 'input.realpower'
    /**
     * Nominal sum value of all (ePDU)  phases real power (W)
     */
    | 'input.realpower.nominal'
    /**
     * Current sum value of all (ePDU)  phases apparent power (VA)
     */
    | 'input.power'
    /**
     * The current input power source
     */
    | 'input.source'
    /**
     * The preferred power source
     */
    | 'input.source.preferred'
    /**
     * Voltage dephasing between input  sources (degrees)
     */
    | 'input.phase.shift';

export type outputVariables =
    /**
     * Output voltage (V)
     */
    | 'output.voltage'
    /**
     * Nominal output voltage (V)
     */
    | 'output.voltage.nominal'
    /**
     * Output frequency (Hz)
     */
    | 'output.frequency'
    /**
     * Nominal output frequency (Hz)
     */
    | 'output.frequency.nominal'
    /**
     * Output current (A)
     */
    | 'output.current'
    /**
     * Nominal output current (A)
     */
    | 'output.current.nominal';

export type baseVariables =
    /**
     * Alarms for phases, published in ups.alarm
     */
    | 'alarm'
    /**
     * Current (A)
     */
    | 'current'
    /**
     * Maximum seen current (A)
     */
    | 'current.maximum'
    /**
     * Minimum seen current (A)
     */
    | 'current.minimum'
    /**
     * Status relative to the thresholds
     */
    | 'current.status'
    /**
     * Low warning threshold (A)
     */
    | 'current.low.warning'
    /**
     * Low critical threshold (A)
     */
    | 'current.low.critical'
    /**
     * High warning threshold (A)
     */
    | 'current.high.warning'
    /**
     * High critical threshold (A)
     */
    | 'current.high.critical'
    /**
     * Peak current
     */
    | 'current.peak'
    /**
     * Voltage (V)
     */
    | 'voltage'
    /**
     * Nominal voltage (V)
     */
    | 'voltage.nominal'
    /**
     * Maximum seen voltage (V)
     */
    | 'voltage.maximum'
    /**
     * Minimum seen voltage (V)
     */
    | 'voltage.minimum'
    /**
     * Status relative to the thresholds
     */
    | 'voltage.status'
    /**
     * Low warning threshold (V)
     */
    | 'voltage.low.warning'
    /**
     * Low critical threshold (V)
     */
    | 'voltage.low.critical'
    /**
     * High warning threshold (V)
     */
    | 'voltage.high.warning'
    /**
     * High critical threshold (V)
     */
    | 'voltage.high.critical'
    /**
     * Apparent power (VA)
     */
    | 'power'
    /**
     * Maximum seen apparent power (VA)
     */
    | 'power.maximum'
    /**
     * Minimum seen apparent power (VA)
     */
    | 'power.minimum'
    /**
     * Percentage of apparent power related to maximum load
     */
    | 'power.percent'
    /**
     * Maximum seen percentage of apparent power
     */
    | 'power.maximum.percent'
    /**
     * Minimum seen percentage of apparent power
     */
    | 'power.minimum.percent'
    /**
     * Real power (W)
     */
    | 'realpower'
    /**
     * Power Factor (dimensionless value between 0.00 and 1.00)
     */
    | 'powerfactor'
    /**
     * Crest Factor (dimensionless value greater or equal to 1)
     */
    | 'crestfactor'
    /**
     * Load on (ePDU) input
     */
    | 'load'
    /**
     * Frequency (Hz)
     */
    | 'frequency'
    /**
     * Nominal frequency (Hz)
     */
    | 'frequency.nominal';

export type batteryVariables =
    /**
     * Battery charge (percent)
     */
    | 'battery.charge'
    /**
     * Rough approximation of battery  charge (opaque, percent)
     */
    | 'battery.charge.approx'
    /**
     * Remaining battery level when  UPS switches to LB (percent)
     */
    | 'battery.charge.low'
    /**
     * Minimum battery level for  UPS restart after power-off
     */
    | 'battery.charge.restart'
    /**
     * Battery level when UPS switches  to \"Warning\" state (percent)
     */
    | 'battery.charge.warning'
    /**
     * Status of the battery charger (see the note below)
     */
    | 'battery.charger.status'
    /**
     * Battery voltage (V)
     */
    | 'battery.voltage'
    /**
     * Maximum battery voltage seen of the  Li-ion cell (V)
     */
    | 'battery.voltage.cell.max'
    /**
     * Minimum battery voltage seen of the  Li-ion cell (V)
     */
    | 'battery.voltage.cell.min'
    /**
     * Nominal battery voltage (V)
     */
    | 'battery.voltage.nominal'
    /**
     * Minimum battery voltage, that  triggers FSD status
     */
    | 'battery.voltage.low'
    /**
     * Maximum battery voltage (i.e. battery.charge = 100)
     */
    | 'battery.voltage.high'
    /**
     * Battery capacity (Ah)
     */
    | 'battery.capacity'
    /**
     * Nominal battery capacity (Ah)
     */
    | 'battery.capacity.nominal'
    /**
     * Battery current (A)
     */
    | 'battery.current'
    /**
     * Total battery current (A)
     */
    | 'battery.current.total'
    /**
     * Health status of the battery (opaque string)
     * @see {ENUTStatus}
     */
    | 'battery.status'
    /**
     * Battery temperature (degrees C)
     */
    | 'battery.temperature'
    /**
     * Maximum battery temperature seen  of the Li-ion cell (degrees C)
     */
    | 'battery.temperature.cell.max'
    /**
     * Minimum battery temperature seen  of the Li-ion cell (degrees C)
     */
    | 'battery.temperature.cell.min'
    /**
     * Battery runtime (seconds)
     */
    | 'battery.runtime'
    /**
     * Remaining battery runtime when  UPS switches to LB (seconds)
     */
    | 'battery.runtime.low'
    /**
     * Minimum battery runtime for UPS  restart after power-off (seconds)
     */
    | 'battery.runtime.restart'
    /**
     * Battery alarm threshold
     */
    | 'battery.alarm.threshold'
    /**
     * Battery installation or last change  date (opaque string)
     */
    | 'battery.date'
    /**
     * Battery next change or maintenance  date (opaque string)
     */
    | 'battery.date.maintenance'
    /**
     * Battery manufacturing date (opaque string)
     */
    | 'battery.mfr.date'
    /**
     * Number of internal battery packs
     */
    | 'battery.packs'
    /**
     * Number of bad battery packs
     */
    | 'battery.packs.bad'
    /**
     * Number of external battery packs
     */
    | 'battery.packs.external'
    /**
     * Battery chemistry (opaque  string)
     */
    | 'battery.type'
    /**
     * Prevent deep discharge of  battery
     */
    | 'battery.protection'
    /**
     * Switch off when running on  battery and no/low load
     */
    | 'battery.energysave'
    /**
     * Switch off UPS if on battery and  load level lower (percent)
     */
    | 'battery.energysave.load'
    /**
     * Delay before switch off UPS if on  battery and load level low (min)
     */
    | 'battery.energysave.delay'
    /**
     * Switch off UPS if on battery  and load level lower (Watts)
     */
    | 'battery.energysave.realpower';

export type ambientVariables =
    /**
     * Total number of sensors
     */
    | 'ambient.count'
    /**
     * Ambient sensor name
     */
    | `ambient.${number}.name`
    /**
     * Ambient sensor identifier (opaque string)
     */
    | `ambient.${number}.id`
    /**
     * Ambient sensor address (opaque string)
     */
    | `ambient.${number}.address`
    /**
     * Ambient sensor parent serial number (opaque string)
     */
    | `ambient.${number}.parent.serial`
    /**
     * Ambient sensor manufacturer
     */
    | `ambient.${number}.mfr`
    /**
     * Ambient sensor model
     */
    | `ambient.${number}.model`
    /**
     * Ambient sensor firmware
     */
    | `ambient.${number}.firmware`
    /**
     * Ambient sensor presence
     */
    | `ambient.${number}.present`
    /**
     * Ambient temperature (degrees C)
     */
    | `ambient.${number}.temperature`
    /**
     * Temperature alarm (enabled/disabled)
     */
    | `ambient.${number}.temperature.alarm`
    /**
     * Ambient temperature status  relative to the thresholds
     */
    | `ambient.${number}.temperature.status`
    /**
     * Temperature threshold high (degrees C)
     */
    | `ambient.${number}.temperature.high`
    /**
     * Temperature threshold high  warning (degrees C)
     */
    | `ambient.${number}.temperature.high.warning`
    /**
     * Temperature threshold high  critical (degrees C)
     */
    | `ambient.${number}.temperature.high.critical`
    /**
     * Temperature threshold low (degrees C)
     */
    | `ambient.${number}.temperature.low`
    /**
     * Temperature threshold low  warning (degrees C)
     */
    | `ambient.${number}.temperature.low.warning`
    /**
     * Temperature threshold low  critical (degrees C)
     */
    | `ambient.${number}.temperature.low.critical`
    /**
     * Maximum temperature seen (degrees C)
     */
    | `ambient.${number}.temperature.maximum`
    /**
     * Minimum temperature seen (degrees C)
     */
    | `ambient.${number}.temperature.minimum`
    /**
     * Ambient relative humidity (percent)
     */
    | `ambient.${number}.humidity`
    /**
     * Relative humidity alarm (enabled/disabled)
     */
    | `ambient.${number}.humidity.alarm`
    /**
     * Ambient humidity status  relative to the thresholds
     */
    | `ambient.${number}.humidity.status`
    /**
     * Relative humidity  threshold high (percent)
     */
    | `ambient.${number}.humidity.high`
    /**
     * Relative humidity threshold  high warning (percent)
     */
    | `ambient.${number}.humidity.high.warning`
    /**
     * Relative humidity threshold  high critical (percent)
     */
    | `ambient.${number}.humidity.high.critical`
    /**
     * Relative humidity  threshold low (percent)
     */
    | `ambient.${number}.humidity.low`
    /**
     * Relative humidity threshold  low warning (percent)
     */
    | `ambient.${number}.humidity.low.warning`
    /**
     * Relative humidity threshold  low critical (percent)
     */
    | `ambient.${number}.humidity.low.critical`
    /**
     * Maximum relative humidity  seen (percent)
     */
    | `ambient.${number}.humidity.maximum`
    /**
     * Minimum relative humidity  seen (percent)
     */
    | `ambient.${number}.humidity.minimum`
    /**
     * State of the dry contact  sensor x
     */
    | `ambient.${number}.contacts.x.status`
    /**
     * Configuration of the dry  contact sensor x
     */
    | `ambient.${number}.contacts.x.config`
    /**
     * Name of the dry contact  sensor x
     */
    | `ambient.${number}.contacts.x.name`;

export type outletVariables =
    /**
     * Total number of outlets
     */
    | 'outlet.count'
    /**
     * General outlet switch ability  of the unit (yes/no)
     */
    | 'outlet.switchable'
    /**
     * Outlet system identifier (opaque string)
     */
    | `outlet.${number}.id`
    /**
     * Outlet name (opaque string)
     */
    | `outlet.${number}.name`
    /**
     * Outlet description (opaque string)
     */
    | `outlet.${number}.desc`
    /**
     * Identifier of the group to  which the outlet belongs to
     */
    | `outlet.${number}.groupid`
    /**
     * Outlet switch control (on/off)
     */
    | `outlet.${number}.switch`
    /**
     * Outlet switch status (on/off)
     */
    | `outlet.${number}.status`
    /**
     * Alarms for outlets and PDU,  published in ups.alarm
     */
    | `outlet.${number}.alarm`
    /**
     * Outlet switch ability (yes/no)
     */
    | `outlet.${number}.switchable`
    /**
     * Remaining battery level to  power off this outlet (percent)
     */
    | `outlet.${number}.autoswitch.charge.low`
    /**
     * Remaining battery level to  power off this outlet (percent)
     */
    | `outlet.${number}.battery.charge.low`
    /**
     * Interval to wait before  shutting down this outlet (seconds)
     */
    | `outlet.${number}.delay.shutdown`
    /**
     * Interval to wait before  restarting this outlet (seconds)
     */
    | `outlet.${number}.delay.start`
    /**
     * Time before the outlet load  will be shutdown (seconds)
     */
    | `outlet.${number}.timer.shutdown`
    /**
     * Time before the outlet load  will be started (seconds)
     */
    | `outlet.${number}.timer.start`
    /**
     * Current (A)
     */
    | `outlet.${number}.current`
    /**
     * Maximum seen current (A)
     */
    | `outlet.${number}.current.maximum`
    /**
     * Current status relative to  the thresholds
     */
    | `outlet.${number}.current.status`
    /**
     * Low warning threshold (A)
     */
    | `outlet.${number}.current.low.warning`
    /**
     * Low critical threshold (A)
     */
    | `outlet.${number}.current.low.critical`
    /**
     * High warning threshold (A)
     */
    | `outlet.${number}.current.high.warning`
    /**
     * High critical threshold (A)
     */
    | `outlet.${number}.current.high.critical`
    /**
     * Current value of real  power (W)
     */
    | `outlet.${number}.realpower`
    /**
     * Voltage (V)
     */
    | `outlet.${number}.voltage`
    /**
     * Voltage status relative to  the thresholds
     */
    | `outlet.${number}.voltage.status`
    /**
     * Low warning threshold (V)
     */
    | `outlet.${number}.voltage.low.warning`
    /**
     * Low critical threshold (V)
     */
    | `outlet.${number}.voltage.low.critical`
    /**
     * High warning threshold (V)
     */
    | `outlet.${number}.voltage.high.warning`
    /**
     * High critical threshold (V)
     */
    | `outlet.${number}.voltage.high.critical`
    /**
     * Power Factor (dimensionless,  value between 0 and 1)
     */
    | `outlet.${number}.powerfactor`
    /**
     * Crest Factor (dimensionless,  equal to or greater than 1)
     */
    | `outlet.${number}.crestfactor`
    /**
     * Apparent power (VA)
     */
    | `outlet.${number}.power`
    /**
     * Physical outlet type
     */
    | `outlet.${number}.type`
    /**
     * seems undocumented, but mentioned only
     */
    | `utlet.group.count`
    /**
     * Type of outlet group (OPAQUE)
     */
    | `outlet.group.${number}.type`
    /**
     * Color-coding of the outlets  in this group (OPAQUE)
     */
    | `outlet.group.${number}.color`
    /**
     * Number of outlets in the group
     */
    | `outlet.group.${number}.count`
    /**
     * Electrical phase to which the  physical outlet group (Gang) is  connected to
     */
    | `outlet.group.${number}.phase`
    /**
     * Input to which an outlet group  is connected
     */
    | `outlet.group.${number}.input`;

export type driverVariables =
    /**
     * Driver name
     */
    | 'driver.name'
    /**
     * Driver version (NUT release)
     */
    | 'driver.version'
    /**
     * Internal driver version
     */
    | 'driver.version.internal'
    /**
     * Version of the internal data  mapping, for generic drivers
     */
    | 'driver.version.data'
    /**
     * USB library version
     */
    | 'driver.version.usb'
    /**
     * Parameter xxx (ups.conf or  cmdline -x) setting
     */
    | `driver.parameter.${string}`
    /**
     * Flag xxx (ups.conf or cmdline -x) status
     */
    | `driver.flag.${string}`
    /**
     * Current state in drivers  lifecycle, primarily to help  readers discern long-running  init (with full device walk)  or cleanup stages from  the stable working loop
     */
    | 'driver.state';

export type serverVariables =
    /**
     * Server information
     */
    | 'server.info'
    /**
     * Server version
     */
    | 'server.version';

export type nutVariablesNames =
    | deviceVariables
    | upsVariables
    | inputVariables
    | outputVariables
    | baseVariables
    | batteryVariables
    | ambientVariables
    | outletVariables
    | driverVariables
    | serverVariables;

export type nutVariables = Record<nutVariablesNames, string>;
