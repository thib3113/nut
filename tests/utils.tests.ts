import { describe, expect, it } from '@jest/globals';
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
    VarNotSupportedError,
    UnknownError
} from '../src/Errors/index.js';
import { errorMessageToError, parseList, variableTypeConverter } from '../src/utils.js';

describe('utils', () => {
    describe('parseList', () => {
        it('should parse a list', () => {
            expect(parseList(`BEGIN LIST UPS\nUPS dummyups "Dummy UPS for testing"\nEND LIST UPS`)).toStrictEqual(
                expect.arrayContaining(['dummyups "Dummy UPS for testing"'])
            );
        });

        it('should remove unwanted results', () => {
            const list = parseList(`BEGIN LIST UPS\nUPS dummyups "Dummy UPS for testing"\nUSER myUser\nEND LIST UPS`);
            expect(list).toStrictEqual(expect.arrayContaining(['dummyups "Dummy UPS for testing"']));

            expect(list.length).toBe(1);
        });

        it('should throw if received an invalid list end', () => {
            expect(() => parseList(`BEGIN LIST UPS\nUPS dummyups "Dummy UPS for testing"`)).toThrowError('fail to parse list (bad END)');
        });

        it('should throw if received an invalid list begin', () => {
            expect(() => parseList('UPS dummyups "Dummy UPS for testing"\nEND LIST UPS`')).toThrowError('fail to parse list (bad BEGIN)');
        });
    });

    describe('variableTypeConverter', () => {
        it('should parse string length', async () => {
            expect(variableTypeConverter('STRING:1')).toStrictEqual({
                type: 'STRING',
                maxLength: 1
            });
            expect(variableTypeConverter('STRING')).toStrictEqual({
                type: 'STRING'
            });
            expect(variableTypeConverter('STRING:100')).toStrictEqual({
                type: 'STRING',
                maxLength: 100
            });
        });
        it('should parse basic types', async () => {
            expect(variableTypeConverter('RW')).toStrictEqual({
                type: 'RW'
            });
            expect(variableTypeConverter('ENUM')).toStrictEqual({
                type: 'ENUM'
            });
            expect(variableTypeConverter('RANGE')).toStrictEqual({
                type: 'RANGE'
            });
            expect(variableTypeConverter('NUMBER')).toStrictEqual({
                type: 'NUMBER'
            });
        });
        it('should return number by default', async () => {
            expect(variableTypeConverter('unknown')).toStrictEqual({
                type: 'NUMBER'
            });
        });
    });

    describe('errorMessageToError', () => {
        const tests: Array<[string, new () => Error]> = [
            ['ACCESS-DENIED', AccessDeniedError],
            ['UNKNOWN-UPS', UnknownUPSError],
            ['VAR-NOT-SUPPORTED', VarNotSupportedError],
            ['CMD-NOT-SUPPORTED', CmdNotSupportedError],
            ['INVALID-ARGUMENT', InvalidArgumentError],
            ['INSTCMD-FAILED', InstcmdFailedError],
            ['SET-FAILED', SetFailedError],
            ['READONLY', ReadonlyError],
            ['TOO-LONG', TooLongError],
            ['FEATURE-NOT-SUPPORTED', FeatureNotSupportedError],
            ['FEATURE-NOT-CONFIGURED', FeatureNotConfiguredError],
            ['ALREADY-SSL-MODE', AlreadySSLModeError],
            ['DRIVER-NOT-CONNECTED', DriverNotConnectedError],
            ['DATA-STALE', DataStaleError],
            ['ALREADY-LOGGED-IN', AlreadyLoggedInError],
            ['INVALID-PASSWORD', InvalidPasswordError],
            ['ALREADY-SET-PASSWORD', AlreadySetPasswordError],
            ['INVALID-USERNAME', InvalidUsernameError],
            ['ALREADY-SET-USERNAME', AlreadySetUsernameError],
            ['USERNAME-REQUIRED', UsernameRequiredError],
            ['PASSWORD-REQUIRED', PasswordRequiredError],
            ['UNKNOWN-COMMAND', UnknownCommandError],
            ['INVALID-VALUE', InvalidValueError]
        ];

        it.each<[string, new () => Error]>(tests)(`should return correct error when nut server throw %s`, (str, error) => {
            expect.assertions(1);
            try {
                errorMessageToError(str);
            } catch (e) {
                expect(e).toBeInstanceOf(error);
            }
        });

        it('should throw unknown error if unknown error', async () => {
            expect.assertions(1);
            try {
                errorMessageToError('random string');
            } catch (e) {
                expect(e).toBeInstanceOf(UnknownError);
            }
        });
    });
});
