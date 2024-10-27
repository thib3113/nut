import { describe, expect, it } from '@jest/globals';
import { parseList, variableTypeConverter } from '../src/index.js';

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
});
