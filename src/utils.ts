import { createDebugger } from './utils.internal.js';
import {
    AccessDeniedError,
    AlreadyLoggedInError,
    AlreadySetPasswordError,
    AlreadySetUsernameError,
    AlreadySSLModeError,
    CmdNotSupportedError,
    DataStaleError,
    DriverNotConnectedError,
    FeatureNotConfiguredError,
    FeatureNotSupportedError,
    InstcmdFailedError,
    InvalidArgumentError,
    InvalidPasswordError,
    InvalidUsernameError,
    InvalidValueError,
    PasswordRequiredError,
    ReadonlyError,
    SetFailedError,
    TooLongError,
    UnknownCommandError,
    UnknownUPSError,
    UsernameRequiredError,
    VarNotSupportedError
} from './Errors/index.js';
import { UnknownError } from './Errors/UnknownError.js';

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
        const maxLength = Number(parseLine(type)[0]?.split(':')?.[1]);
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

export const errorMessageToError = (str: string): string => {
    switch (str?.toUpperCase()) {
        case 'ACCESS-DENIED':
            throw new AccessDeniedError();
        case 'UNKNOWN-UPS':
            throw new UnknownUPSError();
        case 'VAR-NOT-SUPPORTED':
            throw new VarNotSupportedError();
        case 'CMD-NOT-SUPPORTED':
            throw new CmdNotSupportedError();
        case 'INVALID-ARGUMENT':
            throw new InvalidArgumentError();
        case 'INSTCMD-FAILED':
            throw new InstcmdFailedError();
        case 'SET-FAILED':
            throw new SetFailedError();
        case 'READONLY':
            throw new ReadonlyError();
        case 'TOO-LONG':
            throw new TooLongError();
        case 'FEATURE-NOT-SUPPORTED':
            throw new FeatureNotSupportedError();
        case 'FEATURE-NOT-CONFIGURED':
            throw new FeatureNotConfiguredError();
        case 'ALREADY-SSL-MODE':
            throw new AlreadySSLModeError();
        case 'DRIVER-NOT-CONNECTED':
            throw new DriverNotConnectedError();
        case 'DATA-STALE':
            throw new DataStaleError();
        case 'ALREADY-LOGGED-IN':
            throw new AlreadyLoggedInError();
        case 'INVALID-PASSWORD':
            throw new InvalidPasswordError();
        case 'ALREADY-SET-PASSWORD':
            throw new AlreadySetPasswordError();
        case 'INVALID-USERNAME':
            throw new InvalidUsernameError();
        case 'ALREADY-SET-USERNAME':
            throw new AlreadySetUsernameError();
        case 'USERNAME-REQUIRED':
            throw new UsernameRequiredError();
        case 'PASSWORD-REQUIRED':
            throw new PasswordRequiredError();
        case 'UNKNOWN-COMMAND':
            throw new UnknownCommandError();
        case 'INVALID-VALUE':
            throw new InvalidValueError();
        default:
            throw new UnknownError(str);
    }
};

export const checkError = (message: string): string => {
    if (message?.startsWith('ERR')) {
        const errorMessage = message.replace('ERR ', '');

        errorMessageToError(errorMessage);
    }

    return message;
};
