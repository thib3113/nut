import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';

// ---------------------------------------------------------------------------
// Mock infrastructure
// ---------------------------------------------------------------------------

interface MockSocket extends EventEmitter {
    setEncoding: ReturnType<typeof vi.fn>;
    setKeepAlive: ReturnType<typeof vi.fn>;
    setTimeout: ReturnType<typeof vi.fn>;
    destroySoon: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
}

function createMockSocket(): MockSocket {
    const socket = new EventEmitter() as MockSocket;
    socket.setEncoding = vi.fn();
    socket.setKeepAlive = vi.fn();
    socket.setTimeout = vi.fn();
    socket.destroySoon = vi.fn();
    socket.destroy = vi.fn();
    socket.write = vi.fn();
    return socket;
}

const { mockCreateConnection, sockets } = vi.hoisted(() => {
    const sockets: MockSocket[] = [];
    const mockCreateConnection = vi.fn((_port: number, _host: string, cb?: () => void) => {
        const socket = createMockSocket();
        sockets.push(socket);
        // Call connect callback synchronously by default (simulates immediate connection)
        if (cb) {
            cb();
        }
        return socket;
    });
    return { mockCreateConnection, sockets };
});

vi.mock('node:net', () => ({
    default: {
        createConnection: (port: number, host: string, cb?: () => void) => mockCreateConnection(port, host, cb)
    },
    createConnection: (port: number, host: string, cb?: () => void) => mockCreateConnection(port, host, cb)
}));

// Import after mocking
const { RawNUTClient } = await import('../src/RawNUTClient.js');
const { ConnectionLostError } = await import('../src/Errors/ConnectionLostError.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function latestSocket(): MockSocket {
    return sockets[sockets.length - 1];
}

function simulateClose(socket: MockSocket): void {
    socket.emit('close');
}

function simulateError(socket: MockSocket, err?: Error): void {
    socket.emit('error', err ?? new Error('connection lost'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RawNUTClient', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sockets.length = 0;
        mockCreateConnection.mockClear();
        // Default: auto-connect synchronously
        mockCreateConnection.mockImplementation((_port: number, _host: string, cb?: () => void) => {
            const socket = createMockSocket();
            sockets.push(socket);
            if (cb) {
                cb();
            }
            return socket;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should accept options as third parameter', () => {
            const client = new RawNUTClient('127.0.0.1', 3493, {
                timeout: 5000
            });

            expect(client).toBeDefined();
            expect(mockCreateConnection).toHaveBeenCalledWith(3493, '127.0.0.1', expect.any(Function));
        });

        it('should work without options (backward compatible)', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            expect(client).toBeDefined();
            expect(mockCreateConnection).toHaveBeenCalledTimes(1);
        });

        it('should use default port 3493', () => {
            new RawNUTClient('127.0.0.1');
            expect(mockCreateConnection).toHaveBeenCalledWith(3493, '127.0.0.1', expect.any(Function));
        });
    });

    describe('connection', () => {
        it('should be connected after construction', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            expect(client.connected).toBe(true);
        });

        it('should emit disconnected when socket closes after being connected', () => {
            const disconnectedSpy = vi.fn();
            const client = new RawNUTClient('127.0.0.1', 3493);
            client.on('disconnected', disconnectedSpy);

            simulateClose(latestSocket());

            expect(disconnectedSpy).toHaveBeenCalledTimes(1);
            expect(client.connected).toBe(false);
        });

        it('should not emit disconnected when socket closes before connecting', () => {
            mockCreateConnection.mockImplementation((_port: number, _host: string, _cb?: () => void) => {
                const socket = createMockSocket();
                sockets.push(socket);
                return socket;
            });

            const disconnectedSpy = vi.fn();
            const client = new RawNUTClient('127.0.0.1', 3493);
            client.on('disconnected', disconnectedSpy);

            simulateClose(latestSocket());

            expect(disconnectedSpy).not.toHaveBeenCalled();
        });

        it('should not reconnect on close (no auto-reconnect in RawNUTClient)', async () => {
            new RawNUTClient('127.0.0.1', 3493);
            expect(sockets).toHaveLength(1);

            simulateClose(latestSocket());

            await vi.advanceTimersByTimeAsync(60000);
            expect(sockets).toHaveLength(1);
            expect(mockCreateConnection).toHaveBeenCalledTimes(1);
        });
    });

    describe('destroy', () => {
        it('should set connected to false', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            expect(client.connected).toBe(true);

            client.destroy();

            expect(client.connected).toBe(false);
        });

        it('should destroy the TCP socket', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            client.destroy();

            expect(socket.destroy).toHaveBeenCalled();
        });

        it('should kill the command queue', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            client.destroy();

            // After destroy, sending should fail
            expect(client.connected).toBe(false);
        });

        it('should remove all event listeners', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            const disconnectedSpy = vi.fn();
            client.on('disconnected', disconnectedSpy);

            client.destroy();

            expect(client.listenerCount('disconnected')).toBe(0);
        });

        it('should be idempotent (safe to call multiple times)', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            expect(() => {
                client.destroy();
                client.destroy();
                client.destroy();
            }).not.toThrow();

            expect(client.connected).toBe(false);
        });
    });

    describe('default timeout', () => {
        it('should apply default timeout when no per-command timeout', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 5000 });

            const sendPromise = client.send(['VER']);
            // Attach handler synchronously to prevent unhandled rejection during timer advance
            const caught = sendPromise.catch((e: Error) => e);

            await vi.advanceTimersByTimeAsync(5000);

            const error = await caught;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('timeout');
        });

        it('should allow per-command timeout to override default', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 10000 });

            const sendPromise = client.send(['VER'], 2000);
            // Attach handler synchronously to prevent unhandled rejection during timer advance
            const caught = sendPromise.catch((e: Error) => e);

            // After 2000ms the per-command timeout should fire (not the 10000ms default)
            await vi.advanceTimersByTimeAsync(2000);

            const error = await caught;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('timeout');
        });

        it('should not timeout when no default and no per-command timeout', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            const sendPromise = client.send(['VER']);
            sendPromise.catch(() => {}); // prevent unhandled rejection

            // Advance time significantly — no timeout should fire
            await vi.advanceTimersByTimeAsync(60000);

            // The promise should still be pending (no timeout rejection)
            const result = await Promise.race([
                sendPromise.then(
                    () => 'resolved',
                    () => 'rejected'
                ),
                Promise.resolve('pending')
            ]);
            expect(result).toBe('pending');
        });
    });

    describe('timeout timer cleanup', () => {
        it('should clear timeout timer when command completes successfully', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 10000 });

            const sendPromise = client.send(['VER']);

            // Flush microtasks so the queue processes the command and pushes the callback
            await vi.advanceTimersByTimeAsync(0);

            // Simulate server response before timeout
            const socket = latestSocket();
            socket.emit('data', '1.0\n');

            const result = await sendPromise;
            expect(result).toBe('1.0');

            // Advance past the timeout duration — no orphan timer should fire
            // getTimerCount() returns 0 if all timers were properly cleared
            expect(vi.getTimerCount()).toBe(0);
        });

        it('should still timeout when command does not complete', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 3000 });

            const sendPromise = client.send(['VER']);
            const caught = sendPromise.catch((e: Error) => e);

            // Advance to the timeout threshold
            await vi.advanceTimersByTimeAsync(3000);

            const error = await caught;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('timeout');
        });

        it('should not leave orphan timers after multiple successful commands', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 10000 });
            const socket = latestSocket();

            // Send first command, flush queue, then respond
            const p1 = client.send(['VER']);
            await vi.advanceTimersByTimeAsync(0);
            socket.emit('data', '1.0\n');
            await p1;

            // Send second command, flush queue, then respond
            const p2 = client.send(['NETVER']);
            await vi.advanceTimersByTimeAsync(0);
            socket.emit('data', '1.2\n');
            await p2;

            // No orphan timers should remain
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe('in-flight command rejection on disconnect', () => {
        it('should reject in-flight command with ConnectionLostError when socket closes', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const sendPromise = client.send(['VER']);
            // Flush microtasks so the queue processes the command
            await vi.advanceTimersByTimeAsync(0);

            // Simulate socket close before server responds
            simulateClose(socket);

            const error = await sendPromise.catch((e: Error) => e);
            expect(error).toBeInstanceOf(ConnectionLostError);
            expect((error as Error).message).toBe('Connection to NUT server was lost');
        });
    });
});
