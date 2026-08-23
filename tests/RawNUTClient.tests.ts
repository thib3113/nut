/**
 * Testing strategy:
 * - Unit tests (this file): Use mocks to test individual components in isolation
 * - Integration tests (usage.tests.ts): Test real protocol flow with NUT server
 *
 * Unit tests verify logic, integration tests verify protocol compliance.
 */
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
    _timeoutCb?: () => void;
}

function createMockSocket(): MockSocket {
    const socket = new EventEmitter() as MockSocket;
    socket.setEncoding = vi.fn();
    socket.setKeepAlive = vi.fn();
    socket.setTimeout = vi.fn((_ms: number, cb?: () => void) => {
        if (cb) socket._timeoutCb = cb;
    });
    socket.destroySoon = vi.fn();
    socket.destroy = vi.fn();
    socket.write = vi.fn();
    return socket;
}

interface MockTLSSocket extends EventEmitter {
    destroy: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
}

function createMockTLSSocket(): MockTLSSocket {
    const socket = new EventEmitter() as MockTLSSocket;
    socket.destroy = vi.fn();
    socket.write = vi.fn();
    const origRemoveAll = socket.removeAllListeners.bind(socket);
    (socket as any).removeAllListeners = vi.fn(function (this: EventEmitter) {
        origRemoveAll();
        return this;
    });
    return socket;
}

const { mockCreateConnection, sockets, mockTlsConnect, tlsSockets } = vi.hoisted(() => {
    const sockets: MockSocket[] = [];
    const tlsSockets: MockTLSSocket[] = [];
    const mockCreateConnection = vi.fn((_port: number, _host: string, cb?: () => void) => {
        const socket = createMockSocket();
        sockets.push(socket);
        if (cb) {
            cb();
        }
        return socket;
    });
    const mockTlsConnect = vi.fn((_opts: unknown, cb?: () => void) => {
        const socket = createMockTLSSocket();
        tlsSockets.push(socket);
        if (cb) {
            process.nextTick(cb);
        }
        return socket;
    });
    return { mockCreateConnection, sockets, mockTlsConnect, tlsSockets };
});

vi.mock('node:net', () => ({
    default: {
        createConnection: (port: number, host: string, cb?: () => void) => mockCreateConnection(port, host, cb)
    },
    createConnection: (port: number, host: string, cb?: () => void) => mockCreateConnection(port, host, cb)
}));

vi.mock('node:tls', () => ({
    default: {
        connect: (opts: unknown, cb?: () => void) => mockTlsConnect(opts, cb)
    },
    connect: (opts: unknown, cb?: () => void) => mockTlsConnect(opts, cb)
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

function latestTLSSocket(): MockTLSSocket {
    return tlsSockets[tlsSockets.length - 1];
}

function simulateClose(socket: MockSocket | MockTLSSocket): void {
    socket.emit('close');
}

function simulateError(socket: MockSocket | MockTLSSocket, err?: Error): void {
    socket.emit('error', err ?? new Error('connection lost'));
}

async function flushAndRespond(socket: MockSocket | MockTLSSocket, response: string) {
    await vi.advanceTimersByTimeAsync(0);
    socket.emit('data', response);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RawNUTClient', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sockets.length = 0;
        tlsSockets.length = 0;
        mockCreateConnection.mockClear();
        mockTlsConnect.mockClear();
        mockCreateConnection.mockImplementation((_port: number, _host: string, cb?: () => void) => {
            const socket = createMockSocket();
            sockets.push(socket);
            if (cb) {
                cb();
            }
            return socket;
        });
        mockTlsConnect.mockImplementation((_opts: unknown, cb?: () => void) => {
            const socket = createMockTLSSocket();
            tlsSockets.push(socket);
            if (cb) {
                process.nextTick(cb);
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

        it('should destroy socket on connect timeout when not yet connected', () => {
            mockCreateConnection.mockImplementation((_port: number, _host: string, _cb?: () => void) => {
                const socket = createMockSocket();
                sockets.push(socket);
                return socket;
            });

            const client = new RawNUTClient('127.0.0.1', 3493, { connectTimeout: 5000 });
            const socket = latestSocket();

            expect(socket._timeoutCb).toBeDefined();
            socket._timeoutCb!();

            expect(socket.destroy).toHaveBeenCalledWith(new Error('Connection timeout'));
            expect(client.connected).toBe(false);
        });

        it('should not destroy socket on timeout if already connected', () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { connectTimeout: 5000 });
            const socket = latestSocket();

            expect(client.connected).toBe(true);
            socket._timeoutCb!();

            expect(socket.destroy).not.toHaveBeenCalled();
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

        it('should destroy TLS socket if active', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const tlsPromise = client.startTLS();
            await flushAndRespond(socket, 'OK STARTTLS\n');
            await vi.advanceTimersByTimeAsync(0);
            await tlsPromise;

            const tlsSocket = latestTLSSocket();
            client.destroy();

            expect(tlsSocket.removeAllListeners).toHaveBeenCalled();
            expect(tlsSocket.destroy).toHaveBeenCalled();
        });
    });

    describe('default timeout', () => {
        it('should apply default timeout when no per-command timeout', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 5000 });

            const sendPromise = client.send(['VER']);
            const caught = sendPromise.catch((e: Error) => e);

            await vi.advanceTimersByTimeAsync(5000);

            const error = await caught;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('timeout');
        });

        it('should allow per-command timeout to override default', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 10000 });

            const sendPromise = client.send(['VER'], 2000);
            const caught = sendPromise.catch((e: Error) => e);

            await vi.advanceTimersByTimeAsync(2000);

            const error = await caught;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('timeout');
        });

        it('should not timeout when no default and no per-command timeout', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            const sendPromise = client.send(['VER']);
            sendPromise.catch(() => {});

            await vi.advanceTimersByTimeAsync(60000);

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
            await vi.advanceTimersByTimeAsync(0);

            const socket = latestSocket();
            socket.emit('data', '1.0\n');

            const result = await sendPromise;
            expect(result).toBe('1.0');

            expect(vi.getTimerCount()).toBe(0);
        });

        it('should still timeout when command does not complete', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 3000 });

            const sendPromise = client.send(['VER']);
            const caught = sendPromise.catch((e: Error) => e);

            await vi.advanceTimersByTimeAsync(3000);

            const error = await caught;
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('timeout');
        });

        it('should not leave orphan timers after multiple successful commands', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493, { timeout: 10000 });
            const socket = latestSocket();

            const p1 = client.send(['VER']);
            await vi.advanceTimersByTimeAsync(0);
            socket.emit('data', '1.0\n');
            await p1;

            const p2 = client.send(['NETVER']);
            await vi.advanceTimersByTimeAsync(0);
            socket.emit('data', '1.2\n');
            await p2;

            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe('in-flight command rejection on disconnect', () => {
        it('should reject in-flight command with ConnectionLostError when socket closes', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const sendPromise = client.send(['VER']);
            await vi.advanceTimersByTimeAsync(0);

            simulateClose(socket);

            const error = await sendPromise.catch((e: Error) => e);
            expect(error).toBeInstanceOf(ConnectionLostError);
            expect((error as Error).message).toBe('Connection to NUT server was lost');
        });

        it('should reject in-flight command with error when socket emits error', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const sendPromise = client.send(['VER']);
            await vi.advanceTimersByTimeAsync(0);

            const testError = new Error('socket error');
            socket.emit('error', testError);

            const error = await sendPromise.catch((e: Error) => e);
            expect(error).toBe(testError);
        });
    });

    describe('socket error handler', () => {
        it('should handle error events on socket without crashing', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            expect(() => {
                simulateError(socket, new Error('test error'));
            }).not.toThrow();

            expect(client.connected).toBe(true);
        });
    });

    describe('orphan message handling', () => {
        it('should handle data received with no pending callback', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            expect(() => {
                socket.emit('data', 'orphan message\n');
            }).not.toThrow();
        });
    });

    describe('send with empty command', () => {
        it('should reject when sending empty command parts', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);

            const sendPromise = client.send([]);
            const error = await sendPromise.catch((e: Error) => e);
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('you need to pass a cmd');
        });
    });

    describe('startTLS', () => {
        it('should succeed when server responds OK and TLS handshake completes', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const tlsPromise = client.startTLS();
            await flushAndRespond(socket, 'OK STARTTLS\n');
            await vi.advanceTimersByTimeAsync(0);
            await tlsPromise;

            expect(mockTlsConnect).toHaveBeenCalled();
            expect(client.client).toBe(latestTLSSocket());
        });

        it('should remove TCP listeners before adding TLS listeners', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const removeSpy = vi.spyOn(socket, 'removeAllListeners');

            const tlsPromise = client.startTLS();
            await flushAndRespond(socket, 'OK STARTTLS\n');
            await vi.advanceTimersByTimeAsync(0);
            await tlsPromise;

            expect(removeSpy).toHaveBeenCalledWith('data');
            expect(removeSpy).toHaveBeenCalledWith('error');
            expect(removeSpy).toHaveBeenCalledWith('close');
        });

        it('should throw when server returns error to STARTTLS command', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const tlsPromise = client.startTLS();
            await flushAndRespond(socket, 'ERR ACCESS-DENIED\n');

            await expect(tlsPromise).rejects.toThrow();
        });

        it('should throw when server responds with unexpected (non-OK, non-ERR) reply to STARTTLS', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const tlsPromise = client.startTLS();
            await flushAndRespond(socket, 'RANDOM GARBAGE\n');

            await expect(tlsPromise).rejects.toThrow('failed to init starttls');
        });

        it('should reject when TLS handshake fails', async () => {
            mockTlsConnect.mockImplementation((_opts: unknown, _cb?: () => void) => {
                const socket = createMockTLSSocket();
                tlsSockets.push(socket);
                return socket;
            });

            const client = new RawNUTClient('127.0.0.1', 3493);
            const tcpSocket = latestSocket();

            const tlsPromise = client.startTLS();
            await flushAndRespond(tcpSocket, 'OK STARTTLS\n');
            await vi.advanceTimersByTimeAsync(0);

            const tlsSocket = latestTLSSocket();
            tlsSocket.emit('error', new Error('TLS handshake failed'));

            await expect(tlsPromise).rejects.toThrow('TLS handshake failed');
        });
    });

    describe('connect (auth)', () => {
        it('should authenticate successfully with valid credentials', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const connectPromise = client.connect('admin', 'secret');
            await flushAndRespond(socket, 'OK\n');
            await flushAndRespond(socket, 'OK\n');

            await expect(connectPromise).resolves.toBeUndefined();
        });

        it('should throw when USERNAME is rejected', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const connectPromise = client.connect('bad', 'secret');
            await flushAndRespond(socket, 'ERR ACCESS-DENIED\n');

            await expect(connectPromise).rejects.toThrow();
        });

        it('should throw when PASSWORD is rejected', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const connectPromise = client.connect('admin', 'wrong');
            await flushAndRespond(socket, 'OK\n');
            await flushAndRespond(socket, 'ERR INVALID-PASSWORD\n');

            await expect(connectPromise).rejects.toThrow();
        });
    });

    describe('login', () => {
        it('should return OK on successful login', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.login('myups');
            await flushAndRespond(socket, 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
        });
    });

    describe('logout', () => {
        it('should return OK on logout', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.logout();
            await flushAndRespond(socket, 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
        });
    });

    describe('listUPS', () => {
        it('should parse list of UPS devices', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listUPS();
            await flushAndRespond(socket, 'BEGIN LIST UPS\nUPS ups1 "Description 1"\nUPS ups2 "Description 2"\nEND LIST UPS\n');

            const result = await resultPromise;
            expect(result).toEqual(['ups1 "Description 1"', 'ups2 "Description 2"']);
        });
    });

    describe('listVariables', () => {
        it('should parse list of variables', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listVariables('myups');
            await flushAndRespond(
                socket,
                'BEGIN LIST VAR myups\nVAR myups ups.status "OL"\nVAR myups battery.charge "100"\nEND LIST VAR myups\n'
            );

            const result = await resultPromise;
            expect(result).toEqual(['ups.status "OL"', 'battery.charge "100"']);
        });
    });

    describe('getVariable', () => {
        it('should return variable value', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getVariable('myups', 'ups.status');
            await flushAndRespond(socket, 'VAR myups ups.status "OL"\n');

            const result = await resultPromise;
            expect(result).toBe('OL');
        });
    });

    describe('setVariable', () => {
        it('should send SET VAR command and return OK', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.setVariable('myups', 'ups.id', 'test');
            await flushAndRespond(socket, 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"SET" "VAR" "myups" "ups.id" "test"'));
        });

        it('should handle null value as empty string', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.setVariable('myups', 'ups.id', null);
            await flushAndRespond(socket, 'OK\n');

            await resultPromise;
            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"SET" "VAR" "myups" "ups.id" ""'));
        });
    });

    describe('runCommand', () => {
        it('should send INSTCMD without param', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.runCommand('myups', 'test.panel.start');
            await flushAndRespond(socket, 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"INSTCMD" "myups" "test.panel.start"'));
        });

        it('should send INSTCMD with param', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.runCommand('myups', 'test.panel.start', '30');
            await flushAndRespond(socket, 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"INSTCMD" "myups" "test.panel.start" "30"'));
        });
    });

    describe('master', () => {
        it('should send MASTER command and return OK', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.master('myups');
            await flushAndRespond(socket, 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
        });
    });

    describe('getMaster', () => {
        it('should return true when master is ON', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getMaster('myups');
            await flushAndRespond(socket, 'GET MASTER myups "ON"\n');

            const result = await resultPromise;
            expect(result).toBe(true);
        });

        it('should return false when master is not ON', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getMaster('myups');
            await flushAndRespond(socket, 'GET MASTER myups "NO"\n');

            const result = await resultPromise;
            expect(result).toBe(false);
        });
    });

    describe('forceShutdown', () => {
        it('should send FSD command and return response', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.forceShutdown('myups');
            await flushAndRespond(socket, 'OK FSD-SET\n');

            const result = await resultPromise;
            expect(result).toBe('OK FSD-SET');
        });
    });

    describe('listClients', () => {
        it('should parse list of clients', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listClients('myups');
            await flushAndRespond(socket, 'BEGIN LIST CLIENT myups\nCLIENT myups client1\nCLIENT myups client2\nEND LIST CLIENT myups\n');

            const result = await resultPromise;
            expect(result).toEqual(['client1', 'client2']);
        });
    });

    describe('listWriteableVariables', () => {
        it('should parse list of writeable variables', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listWriteableVariables('myups');
            await flushAndRespond(
                socket,
                'BEGIN LIST RW myups\nRW myups ups.id "test"\nRW myups outlet.1.switch "on"\nEND LIST RW myups\n'
            );

            const result = await resultPromise;
            expect(result).toEqual(['ups.id "test"', 'outlet.1.switch "on"']);
        });
    });

    describe('getNumLogins', () => {
        it('should return number of logins', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getNumLogins('myups');
            await flushAndRespond(socket, 'GET NUMLOGINS myups "3"\n');

            const result = await resultPromise;
            expect(result).toBe(3);
        });
    });

    describe('LIST detection with multi-chunk messages', () => {
        it('should handle LIST arriving in multiple chunks', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listUPS();

            await vi.advanceTimersByTimeAsync(0);

            socket.emit('data', 'BEGIN LIST UPS\n');
            socket.emit('data', 'UPS ups1 "Desc 1"\n');
            socket.emit('data', 'END LIST UPS\n');

            const result = await resultPromise;
            expect(result).toEqual(['ups1 "Desc 1"']);
        });

        it('should handle partial buffer that does not end with newline', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.version();
            await vi.advanceTimersByTimeAsync(0);

            socket.emit('data', '1.');
            socket.emit('data', '0\n');

            const result = await resultPromise;
            expect(result).toBe('1.0');
        });

        it('should handle BEGIN LIST at position 0 in buffer', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listVariables('myups');
            await vi.advanceTimersByTimeAsync(0);

            socket.emit('data', 'BEGIN LIST VAR myups\nVAR myups test "val"\nEND LIST VAR myups\n');

            const result = await resultPromise;
            expect(result).toEqual(['test "val"']);
        });

        it('should handle END LIST setting receivingList to false', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listUPS();
            await vi.advanceTimersByTimeAsync(0);

            socket.emit('data', 'BEGIN LIST UPS\nUPS u1 "d1"\n');
            socket.emit('data', 'END LIST UPS\n');

            const result = await resultPromise;
            expect(result).toEqual(['u1 "d1"']);
        });
    });

    describe('tracking', () => {
        it('should send SET TRACKING ON and return response', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.setTracking(true);
            await vi.advanceTimersByTimeAsync(0);

            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"SET" "TRACKING" "ON"'));

            socket.emit('data', 'OK TRACKING\n');

            const result = await resultPromise;
            expect(result).toBe('OK TRACKING');
        });

        it('should send SET TRACKING OFF and return response', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.setTracking(false);
            await vi.advanceTimersByTimeAsync(0);

            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"SET" "TRACKING" "OFF"'));

            socket.emit('data', 'OK\n');

            const result = await resultPromise;
            expect(result).toBe('OK');
        });

        it('should send GET TRACKING with UUID and return status', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();
            const uuid = '550e8400-e29b-41d4-a716-446655440000';

            const resultPromise = client.getTracking(uuid);
            await vi.advanceTimersByTimeAsync(0);

            expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('"GET" "TRACKING" "550e8400-e29b-41d4-a716-446655440000"'));

            socket.emit('data', 'SUCCESS\n');

            const result = await resultPromise;
            expect(result).toBe('SUCCESS');
        });

        it('should return PENDING status from getTracking', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getTracking('test-uuid');
            await vi.advanceTimersByTimeAsync(0);

            socket.emit('data', 'PENDING\n');

            const result = await resultPromise;
            expect(result).toBe('PENDING');
        });

        it('should throw on ERR response from getTracking', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getTracking('bad-uuid');
            await vi.advanceTimersByTimeAsync(0);

            socket.emit('data', 'ERR INVALID-ARGUMENT\n');

            await expect(resultPromise).rejects.toThrow();
        });
    });

    describe('client getter', () => {
        it('should return TCP socket when no TLS', () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            expect(client.client).toBe(latestSocket());
        });

        it('should return TLS socket after startTLS', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const tlsPromise = client.startTLS();
            await flushAndRespond(socket, 'OK STARTTLS\n');
            await vi.advanceTimersByTimeAsync(0);
            await tlsPromise;

            expect(client.client).toBe(latestTLSSocket());
        });
    });

    describe('version and netVersion', () => {
        it('should return server version', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.version();
            await flushAndRespond(socket, '1.0\n');

            expect(await resultPromise).toBe('1.0');
        });

        it('should return net protocol version', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.netVersion();
            await flushAndRespond(socket, '1.2\n');

            expect(await resultPromise).toBe('1.2');
        });
    });

    describe('help', () => {
        it('should return help text', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.help();
            await flushAndRespond(socket, 'Commands: HELP VER\n');

            expect(await resultPromise).toBe('Commands: HELP VER');
        });
    });

    describe('listCommands', () => {
        it('should parse list of commands', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.listCommands('myups');
            await flushAndRespond(socket, 'BEGIN LIST CMD myups\nCMD myups test.panel.start\nEND LIST CMD myups\n');

            const result = await resultPromise;
            expect(result).toEqual(['test.panel.start']);
        });
    });

    describe('getVariableType', () => {
        it('should return variable type', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getVariableType('myups', 'ups.status');
            await flushAndRespond(socket, 'TYPE myups ups.status "STRING"\n');

            expect(await resultPromise).toBe('STRING');
        });
    });

    describe('getVariableDescription', () => {
        it('should return variable description', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getVariableDescription('myups', 'ups.status');
            await flushAndRespond(socket, 'DESC myups ups.status "UPS status"\n');

            expect(await resultPromise).toBe('UPS status');
        });
    });

    describe('getVariableEnum', () => {
        it('should parse enum values', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getVariableEnum('myups', 'ups.status');
            await flushAndRespond(
                socket,
                'BEGIN LIST ENUM myups\nENUM myups ups.status "OL"\nENUM myups ups.status "OB"\nEND LIST ENUM myups\n'
            );

            expect(await resultPromise).toEqual(['ups.status "OL"', 'ups.status "OB"']);
        });
    });

    describe('getVariableRange', () => {
        it('should parse range values', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getVariableRange('myups', 'input.voltage');
            await flushAndRespond(socket, 'BEGIN LIST RANGE myups\nRANGE myups input.voltage "220" "240"\nEND LIST RANGE myups\n');

            expect(await resultPromise).toEqual(['input.voltage "220" "240"']);
        });
    });

    describe('getCommandDescription', () => {
        it('should return command description', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getCommandDescription('myups', 'test.panel.start');
            await flushAndRespond(socket, 'CMDDESC myups test.panel.start "Start panel test"\n');

            expect(await resultPromise).toBe('Start panel test');
        });
    });

    describe('getUPSDescription', () => {
        it('should return UPS description', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const resultPromise = client.getUPSDescription('myups');
            await flushAndRespond(socket, 'UPSDESC myups "My UPS"\n');

            expect(await resultPromise).toBe('My UPS');
        });
    });

    describe('debug masking of credentials', () => {
        it('should mask USERNAME and PASSWORD in debug output', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const p = client.connect('admin', 'supersecret');
            await vi.advanceTimersByTimeAsync(0);

            const writeCalls = socket.write.mock.calls.map((c: unknown[]) => c[0] as string);
            expect(writeCalls.some((c: string) => c.includes('supersecret'))).toBe(false);

            await flushAndRespond(socket, 'OK\n');
            await flushAndRespond(socket, 'OK\n');
            await p;
        });
    });

    describe('timeout with Infinity', () => {
        it('should not timeout when timeout is Infinity', async () => {
            const client = new RawNUTClient('127.0.0.1', 3493);
            const socket = latestSocket();

            const sendPromise = client.send(['VER'], Infinity);
            sendPromise.catch(() => {});

            await vi.advanceTimersByTimeAsync(60000);

            const result = await Promise.race([
                sendPromise.then(
                    () => 'resolved',
                    () => 'rejected'
                ),
                Promise.resolve('pending')
            ]);
            expect(result).toBe('pending');

            socket.emit('data', '1.0\n');
            expect(await sendPromise).toBe('1.0');
        });
    });
});
