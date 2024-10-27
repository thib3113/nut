import { describe, expect, it } from '@jest/globals';
import { createDebugger } from '../src/utils.internal.js';

describe('createDebugger', () => {
    it('should create a debugger', async () => {
        const debug = createDebugger('test');

        expect(debug.color).toBeDefined();
    });

    it('should crash if no name', async () => {
        expect(() => createDebugger('')).toThrow();
    });
});
