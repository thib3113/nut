import createDebug, { Debugger } from 'debug';
import { pkg } from './pkg.js';

const rootDebug = createDebug(pkg.name);
/**
 * create a debugger extending the default debugger
 * @param name - name for the debugger
 */
export const createDebugger = (name: string): Debugger => {
    if (!name) {
        throw new Error('name is mandatory');
    }
    return rootDebug.extend(name);
};
