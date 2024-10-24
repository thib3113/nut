import { createDebugger } from './utils.internal.js';

const debug = createDebugger('NUTClient.utils');

export const parseLine = (line: string): Array<string> => {
    debug('parseLine: %o', line);
    const regex = /"([^"]*)"|(\S+)/g;
    const parts = [];
    let match;

    while ((match = regex.exec(line)) !== null) {
        parts.push(match[1] ?? match[2]);
    }

    return parts;
};

export const parseList = (listOutput: string): Array<string> => {
    debug('parseList: %o', listOutput);

    checkError(listOutput);

    const lines = listOutput.split('\n');

    const firstLine = parseLine(lines.shift() ?? '');
    const linePrefix = firstLine.slice(2).join(' ');
    if (firstLine.slice(0, 2).join(' ') !== 'BEGIN LIST' || !linePrefix) {
        debug('received invalid list (bad BEGIN) : %O', listOutput);
        throw new Error('fail to parse list (bad BEGIN)');
    }

    const lastLine = parseLine(lines.pop() ?? '');
    if (lastLine.slice(0, 2).join(' ') !== 'END LIST' || lastLine.slice(2).join(' ') !== linePrefix) {
        debug('received invalid list (bad END) : %O', listOutput);
        throw new Error('fail to parse list (bad END)');
    }

    return lines.reduce((previousValue: Array<string>, currentValue: string) => {
        if (!currentValue.startsWith(linePrefix)) {
            debug(`parseList remove unwanted object type %o != %o`, currentValue, linePrefix);
            return previousValue;
        }

        return [...previousValue, currentValue?.replace(`${linePrefix} `, '')];
    }, []);
};

export const EVariableType = {
    RW: 'RW',
    ENUM: 'ENUM',
    STRING: 'STRING',
    RANGE: 'RANGE',
    NUMBER: 'NUMBER'
} as const;

export const variableTypeConverter = (
    type: string
): { type: (typeof EVariableType)[keyof typeof EVariableType] } & Record<string, unknown> => {
    debug('variableTypeConverter %s', type);
    if (type.startsWith('STRING:')) {
        const maxLength = parseLine(type)[0]?.split(':')?.[1];
        return {
            type: EVariableType.STRING,
            maxLength
        };
    }

    const existingType = EVariableType[type?.toUpperCase() as keyof typeof EVariableType];
    if (existingType) {
        return { type: existingType };
    }

    debug('variableTypeConverter %s . no type found, return NUMBER', type);
    return { type: EVariableType.NUMBER };
};

export const getErrorMessage = (str: string): string => {
    switch (str?.toUpperCase()) {
        case 'ACCESS-DENIED':
            return 'The client’s host and/or authentication details (username, password) are not sufficient to execute the requested command.';
        case 'UNKNOWN-UPS':
            return 'The UPS specified in the request is not known to upsd. This usually means that it didn’t match anything in ups.conf.';
        case 'VAR-NOT-SUPPORTED':
            return 'The specified UPS doesn’t support the variable in the request. This is also sent for unrecognized variables which are in a space which is handled by upsd, such as server.*.';
        case 'CMD-NOT-SUPPORTED':
            return 'The specified UPS doesn’t support the instant command in the request.';
        case 'INVALID-ARGUMENT':
            return 'The client sent an argument to a command which is not recognized or is otherwise invalid in this context. This is typically caused by sending a valid command like GET with an invalid subcommand.';
        case 'INSTCMD-FAILED':
            return 'upsd failed to deliver the instant command request to the driver. No further information is available to the client. This typically indicates a dead or broken driver.';
        case 'SET-FAILED':
            return 'upsd failed to deliver the set request to the driver. This is just like INSTCMD-FAILED above.';
        case 'READONLY':
            return 'The requested variable in a SET command is not writable.';
        case 'TOO-LONG':
            return 'The requested value in a SET command is too long.';
        case 'FEATURE-NOT-SUPPORTED':
            return 'This instance of upsd does not support the requested feature. This is only used for TLS/SSL mode (STARTTLS) at the moment.';
        case 'FEATURE-NOT-CONFIGURED':
            return 'This instance of upsd hasn’t been configured properly to allow the requested feature to operate. This is also limited to STARTTLS for now.';
        case 'ALREADY-SSL-MODE':
            return 'TLS/SSL mode is already enabled on this connection, so upsd can’t start it again.';
        case 'DRIVER-NOT-CONNECTED':
            return 'upsd can’t perform the requested command, since the driver for that UPS is not connected. This usually means that the driver is not running, or if it is, the ups.conf is misconfigured.';
        case 'DATA-STALE':
            return 'upsd is connected to the driver for the UPS, but that driver isn’t providing regular updates or has specifically marked the data as stale. upsd refuses to provide variables on stale units to avoid false readings. This generally means that the driver is running, but it has lost communications with the hardware. Check the physical connection to the equipment.';
        case 'ALREADY-LOGGED-IN':
            return 'The client already sent LOGIN for a UPS and can’t do it again. There is presently a limit of one LOGIN record per connection.';
        case 'INVALID-PASSWORD':
            return 'The client sent an invalid PASSWORD . perhaps an empty one.';
        case 'ALREADY-SET-PASSWORD':
            return 'The client already set a PASSWORD and can’t set another. This also should never happen with normal NUT clients.';
        case 'INVALID-USERNAME':
            return 'The client sent an invalid USERNAME.';
        case 'ALREADY-SET-USERNAME':
            return 'The client has already set a USERNAME, and can’t set another. This should never happen with normal NUT clients.';
        case 'USERNAME-REQUIRED':
            return 'The requested command requires a username for authentication, but the client hasn’t set one.';
        case 'PASSWORD-REQUIRED':
            return 'The requested command requires a passname for authentication, but the client hasn’t set one.';
        case 'UNKNOWN-COMMAND':
            return 'upsd doesn’t recognize the requested command.';
        case 'INVALID-VALUE':
            return 'The value specified in the request is not valid. This usually applies to a SET of an ENUM type which is using a value which is not in the list of allowed values.';
    }

    return str;
};

export const checkError = (message: string): string => {
    if (message?.startsWith('ERR')) {
        const errorMessage = message.replace('ERR ', '');

        throw new Error(getErrorMessage(errorMessage));
    }

    return message;
};
