# nut-client

[![NPM version](https://img.shields.io/npm/v/nut-client.svg)](https://www.npmjs.com/package/nut-client)
[![CI](https://github.com/thib3113/nut/actions/workflows/CI.yml/badge.svg)](https://github.com/thib3113/nut/actions/workflows/CI.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=coverage)](https://sonarcloud.io/summary/new_code?id=thib3113_nut)
[![Downloads](https://img.shields.io/npm/dm/nut-client.svg)](https://www.npmjs.com/package/nut-client)
[![License](https://img.shields.io/npm/l/nut-client)](https://github.com/thib3113/nut/blob/main/LICENSE)
[![Known Vulnerabilities](https://snyk.io/test/github/thib3113/nut/badge.svg)](https://snyk.io/test/github/thib3113/nut)
[![nut-client-snyk](https://snyk.io/advisor/npm-package/nut-client/badge.svg)](https://snyk.io/advisor/npm-package/nut-client)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg?logo=paypal)](https://paypal.me/thib3113)
[![GitHub stars](https://img.shields.io/github/stars/thib3113/nut.svg?style=social&label=Star)](https://github.com/thib3113/nut/stargazers/)
[![Package Quality](https://packagequality.com/shield/nut-client.svg)](https://packagequality.com/#?package=nut-client)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=bugs)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=code_smells)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=ncloc)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=alert_status)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=security_rating)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=sqale_index)](https://sonarcloud.io/dashboard?id=thib3113_nut)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=thib3113_nut&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=thib3113_nut)

![Dependencies update - renovate](https://img.shields.io/badge/renovate-enabled-green?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjUgNSAzNzAgMzcwIj48Y2lyY2xlIGN4PSIxODkiIGN5PSIxOTAiIHI9IjE4NCIgZmlsbD0iI2ZlMiIvPjxwYXRoIGZpbGw9IiM4YmIiIGQ9Ik0yNTEgMjU2bC0zOC0zOGExNyAxNyAwIDAxMC0yNGw1Ni01NmMyLTIgMi02IDAtN2wtMjAtMjFhNSA1IDAgMDAtNyAwbC0xMyAxMi05LTggMTMtMTNhMTcgMTcgMCAwMTI0IDBsMjEgMjFjNyA3IDcgMTcgMCAyNGwtNTYgNTdhNSA1IDAgMDAwIDdsMzggMzh6Ii8+PHBhdGggZmlsbD0iI2Q1MSIgZD0iTTMwMCAyODhsLTggOGMtNCA0LTExIDQtMTYgMGwtNDYtNDZjLTUtNS01LTEyIDAtMTZsOC04YzQtNCAxMS00IDE1IDBsNDcgNDdjNCA0IDQgMTEgMCAxNXoiLz48cGF0aCBmaWxsPSIjYjMwIiBkPSJNMjg1IDI1OGw3IDdjNCA0IDQgMTEgMCAxNWwtOCA4Yy00IDQtMTEgNC0xNiAwbC02LTdjNCA1IDExIDUgMTUgMGw4LTdjNC01IDQtMTIgMC0xNnoiLz48cGF0aCBmaWxsPSIjYTMwIiBkPSJNMjkxIDI2NGw4IDhjNCA0IDQgMTEgMCAxNmwtOCA3Yy00IDUtMTEgNS0xNSAwbC05LThjNSA1IDEyIDUgMTYgMGw4LThjNC00IDQtMTEgMC0xNXoiLz48cGF0aCBmaWxsPSIjZTYyIiBkPSJNMjYwIDIzM2wtNC00Yy02LTYtMTctNi0yMyAwLTcgNy03IDE3IDAgMjRsNCA0Yy00LTUtNC0xMSAwLTE2bDgtOGM0LTQgMTEtNCAxNSAweiIvPjxwYXRoIGZpbGw9IiNiNDAiIGQ9Ik0yODQgMzA0Yy00IDAtOC0xLTExLTRsLTQ3LTQ3Yy02LTYtNi0xNiAwLTIybDgtOGM2LTYgMTYtNiAyMiAwbDQ3IDQ2YzYgNyA2IDE3IDAgMjNsLTggOGMtMyAzLTcgNC0xMSA0em0tMzktNzZjLTEgMC0zIDAtNCAybC04IDdjLTIgMy0yIDcgMCA5bDQ3IDQ3YTYgNiAwIDAwOSAwbDctOGMzLTIgMy02IDAtOWwtNDYtNDZjLTItMi0zLTItNS0yeiIvPjxwYXRoIGZpbGw9IiMxY2MiIGQ9Ik0xNTIgMTEzbDE4LTE4IDE4IDE4LTE4IDE4em0xLTM1bDE4LTE4IDE4IDE4LTE4IDE4em0tOTAgODlsMTgtMTggMTggMTgtMTggMTh6bTM1LTM2bDE4LTE4IDE4IDE4LTE4IDE4eiIvPjxwYXRoIGZpbGw9IiMxZGQiIGQ9Ik0xMzQgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em0tMzUgMzZsMTgtMTggMTggMTgtMTggMTh6Ii8+PHBhdGggZmlsbD0iIzJiYiIgZD0iTTExNiAxNDlsMTgtMTggMTggMTgtMTggMTh6bTU0LTU0bDE4LTE4IDE4IDE4LTE4IDE4em0tODkgOTBsMTgtMTggMTggMTgtMTggMTh6bTEzOS04NWwyMyAyM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTI0LTI0Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS01IDEyLTUgMTYgMHoiLz48cGF0aCBmaWxsPSIjM2VlIiBkPSJNMTM0IDk1bDE4LTE4IDE4IDE4LTE4IDE4em0tNTQgMThsMTgtMTcgMTggMTctMTggMTh6bTU1LTUzbDE4LTE4IDE4IDE4LTE4IDE4em05MyA0OGwtOC04Yy00LTUtMTEtNS0xNiAwTDEwMyAyMDFjLTQgNC00IDExIDAgMTVsOCA4Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS00IDEyLTQgMTYgMHoiLz48cGF0aCBmaWxsPSIjOWVlIiBkPSJNMjcgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em01NC01M2wxOC0xOCAxOCAxOC0xOCAxOHoiLz48cGF0aCBmaWxsPSIjMGFhIiBkPSJNMjMwIDExMGwxMyAxM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTEzLTEzYzQgNCAxMSA0IDE1IDBsMTAxLTEwMWM1LTUgNS0xMSAwLTE2eiIvPjxwYXRoIGZpbGw9IiMxYWIiIGQ9Ik0xMzQgMjQ4Yy00IDAtOC0yLTExLTVsLTIzLTIzYTE2IDE2IDAgMDEwLTIzTDIwMSA5NmExNiAxNiAwIDAxMjIgMGwyNCAyNGM2IDYgNiAxNiAwIDIyTDE0NiAyNDNjLTMgMy03IDUtMTIgNXptNzgtMTQ3bC00IDItMTAxIDEwMWE2IDYgMCAwMDAgOWwyMyAyM2E2IDYgMCAwMDkgMGwxMDEtMTAxYTYgNiAwIDAwMC05bC0yNC0yMy00LTJ6Ii8+PC9zdmc+
)
[![NPM](https://nodei.co/npm/nut-client.png)](https://nodei.co/npm/nut-client/)

## Description

`nut-client` is a Node.js client for **Network UPS Tools (NUT)**, enabling advanced communication with NUT servers for UPS management. It is built to be robust, performant, and easy to integrate, supporting parallel requests, automatic reconnection, and event-based monitoring via Promises.

## Installation

```bash
npm install nut-client
# or
pnpm add nut-client
# or
yarn add nut-client
```

**Supported Node.js versions:** >=18

## Features

- **NUT Command Support** : Most NUT commands are supported, with automatic parsing of responses to simplify integration. Additionally, a manual mode is available for full control.

  ```ts
  import { NUTClient } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493);

  console.log(await client.listUPS());
  console.log(await client.listVariables('ups'));

  // Run an instant command with optional parameter
  await client.runCommand('myups', 'shutdown.return', '60');

  // Manual command
  console.log(await client.send(['LIST', 'VAR', 'myups']));
  ```

- **Parallel Request Handling** : Unlike other NUT libraries, `nut-client` manages an internal queue to handle parallel requests without conflicts, using Promises for efficient request handling.

  ```ts
  import { NUTClient } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493);

  const [ups1, ups2, ups3] = await Promise.all([
    client.getUPS('ups1'),
    client.getUPS('ups2'),
    client.getUPS('ups3'),
  ])

  ```

- **Auto-Reconnect** : The client can automatically reconnect on connection loss with exponential backoff, jitter, and configurable limits. Credentials and TLS state are restored automatically.

  ```ts
  import { NUTClient } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493, {
    autoReconnect: true,
    username: 'admin',
    password: 'secret',
    reconnectDelay: 1000,        // initial delay (ms)
    maxReconnectDelay: 30000,    // cap for exponential backoff
    reconnectBackoff: 2,         // multiplier
    maxReconnectAttempts: 10,    // give up after N attempts
  });

  client.on('reconnected', () => console.log('Reconnected!'));
  client.on('reconnectExhausted', () => console.log('No more retries'));

  // Or use the static factory for connect + auth in one call
  const client2 = await NUTClient.create('127.0.0.1', 3493, {
    username: 'admin',
    password: 'secret',
    autoReconnect: true,
  });
  ```

- **StartTLS Support** : Communicate securely with the NUT server using StartTLS for encryption. TLS state is automatically restored on reconnect.

  ```ts
  import { NUTClient } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493);

  // Use clear TCP connection
  console.log(await client.version());

  await client.startTLS({
    // Allow self-signed certificate
    rejectUnauthorized: false
  });

  // Use encrypted TCP connection
  console.log(await client.version());
  ```

- **UPS Object with Convenience Methods** : Get a typed `UPS` object with high-level helpers for status, battery, load, and more.

  ```ts
  const client = new NUTClient('127.0.0.1', 3493);
  const ups = await client.getUPS('myups');

  if (ups) {
    console.log('Description:', ups.description);

    const status = await ups.getStatus();    // ENUTStatus[] (e.g. ['OL', 'CHRG'])
    console.log('Online:', await ups.isOnline());
    console.log('On battery:', await ups.isOnBattery());
    console.log('Battery charge:', await ups.getBatteryCharge());  // 0-100 or NaN
    console.log('Runtime:', await ups.getBatteryRuntime());        // seconds or NaN
    console.log('Load:', await ups.getLoad());                     // 0-100 or NaN
    console.log('Model:', await ups.getModel());
    console.log('Manufacturer:', await ups.getManufacturer());
    console.log('Serial:', await ups.getSerial());
    console.log('Input voltage:', await ups.getInputVoltage());
    console.log('Output voltage:', await ups.getOutputVoltage());
  }
  ```

- **Built-in Monitor** : A `Monitor` module reads variables at regular intervals, emitting UPS events similar to `upsmon` (plus additional "NOT" events and variable change tracking). It integrates with the auto-reconnect system — when the client reconnects, the Monitor resumes automatically; when reconnect is exhausted, it emits `NOCOMM`.

  ```ts
  import { NUTClient, Monitor } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493);
  const monitor = new Monitor(client, 'myUps');

  // Status events (when a flag appears)
  monitor.on('ONLINE', () => console.log('UPS back online'));
  monitor.on('ONBATT', () => console.log('UPS on battery'));
  monitor.on('LOWBATT', () => console.log('Battery low'));

  // "NOT" events (when a flag disappears)
  monitor.on('NOTOL', () => console.log('No longer online'));
  monitor.on('NOTOB', () => console.log('No longer on battery'));
  monitor.on('NOTLB', () => console.log('Battery no longer low'));
  monitor.on('NOTFSD', () => console.log('FSD cleared'));
  monitor.on('NOTRB', () => console.log('Battery replacement cleared'));
  monitor.on('NOTCAL', () => console.log('Calibration finished'));
  monitor.on('NOTOFF', () => console.log('UPS no longer off'));
  monitor.on('NOTBYPASS', () => console.log('No longer on bypass'));

  // Communication events
  monitor.on('COMMOK', () => console.log('Communication restored'));
  monitor.on('COMMBAD', () => console.log('Communication lost'));
  monitor.on('NOCOMM', () => console.log('Reconnect exhausted'));

  // Variable change events
  monitor.on('VARIABLE_CHANGED', (key, oldValue, newValue, oldVars, newVars) => {
    console.log(`${key}: ${oldValue} → ${newValue}`);
  });

  // Fired when any variable changed in a poll cycle
  monitor.on('VARIABLES_CHANGED', (oldVars, newVars) => {
    console.log('Variables updated');
  });

  monitor.on('BATTERY_CHARGE', (charge, raw) => {
    console.log(`Battery: ${charge}%`);
  });

  // Wildcard listener for debugging
  monitor.on('*', (event, ...args) => {
    console.log(`Event: ${event}`, args);
  });

  await monitor.start();

  // Pause/resume without full restart
  monitor.pause();
  monitor.isPaused();  // check if paused
  monitor.resume();

  // Check lifecycle state
  monitor.isDestroyed();

  // Cleanup
  monitor.destroy();
  ```

  Full event list available in the [TypeDoc documentation](https://thib3113.github.io/nut/interfaces/IMonitorEvents.html).

- **Command Tracking** : For long-running write operations, enable tracking to get a UUID per command and poll for completion. Only write commands (SET VAR, INSTCMD) are tracked; reads are unaffected. Requires NUT 2.8.0+ (protocol v1.3).

  **Manual polling:**
  ```ts
  import { NUTClient } from 'nut-client';

  const client = new NUTClient('127.0.0.1', 3493);
  await client.connect('user', 'secret');

  // Enable tracking
  await client.setTracking(true);

  // Long-running command returns immediately with a tracking UUID
  const result = await client.runCommand('myups', 'shutdown.return', '60');
  // result = { tracked: true, trackingUid: 'abc-123-def' }

  if (result.tracked && 'trackingUid' in result) {
    // Poll until the command completes
    let status;
    do {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await client.getTracking(result.trackingUid);
      console.log('Status:', status);
    } while (status === 'PENDING');

    if (status === 'SUCCESS') {
      console.log('Shutdown completed');
    } else {
      console.log('Shutdown failed');
    }
  }

  // Disable tracking when done
  await client.setTracking(false);
  ```

  **Automatic polling with `followTracking`:**
  ```ts
  // Enable tracking
  await client.setTracking(true);

  // Command with automatic polling — resolves when complete
  const result = await client.runCommand('myups', 'shutdown.return', '60', {
    followTracking: true,
    trackingTimeout: 60000,      // max wait time (default: 30s)
    trackingPollInterval: 5000   // poll interval (default: 1s)
  });
  // result = { tracked: true, status: 'SUCCESS' } | { tracked: true, status: 'ERR' }

  if (result.tracked && result.status === 'SUCCESS') {
    console.log('Shutdown completed');
  }
  ```

  See the [NUT network protocol documentation](https://networkupstools.org/docs/developer-guide.chunked/ar01s09.html) for details on the tracking protocol.

- **UPS Management Commands** : Additional server-side operations like getting descriptions and forcing shutdowns.

  ```ts
  const client = new NUTClient('127.0.0.1', 3493);

  // Get the UPS description (from ups.conf desc= field)
  const desc = await client.getUPSDescription('myups');

  // Force a shutdown (sets the FSD flag — requires master/FSD permission)
  await client.forceShutdown('myups');
  ```

- **Fully Typed with TypeScript (ESM + CJS)** : Built with TypeScript, `nut-client` is distributed in both ESM and CommonJS modules for maximum compatibility.

## API Overview

| Class | Description |
|---|---|
| `NUTClient` | High-level client facade with auto-reconnect, tracking, and typed parsing |
| `RawNUTClient` | Low-level TCP client for raw NUT protocol access (advanced use) |
| `UPS` | Typed representation of a UPS device with convenience methods |
| `Monitor` | Event-based UPS monitoring with status, variable change, and communication events |

### NUTClient Static Factory

```ts
// Create and authenticate in one call
const client = await NUTClient.create('127.0.0.1', 3493, {
  username: 'admin',
  password: 'secret',
  autoReconnect: true,
});
```

### NUTClient Events

```ts
client.on('disconnected', () => {});
client.on('reconnecting', (attempt, delay) => {});
client.on('reconnected', () => {});
client.on('reconnectFailed', (attempt) => {});
client.on('reconnectExhausted', () => {});
client.on('destroyed', () => {});
```

### Error Handling

`nut-client` throws typed errors that map to NUT protocol error codes. All errors extend `NUTProtocolError`:

```ts
import { AccessDeniedError, UnknownUPSError, ConnectionLostError } from 'nut-client';

try {
  await client.getVariable('myups', 'battery.charge');
} catch (e) {
  if (e instanceof AccessDeniedError) {
    console.log('Authentication required');
  } else if (e instanceof UnknownUPSError) {
    console.log('UPS not found');
  } else if (e instanceof ConnectionLostError) {
    console.log('Connection lost');
  }
}
```

### Cleanup

```ts
// Destroy the client (releases TCP socket, clears timers, removes listeners)
client.destroy();

// Destroy a monitor
monitor.destroy();
```

## Debug

This library includes [debug](https://www.npmjs.com/package/debug). To enable debug logging:

```bash
DEBUG=nut-client:* node my-script.js
```

## Contributing

Contributions are welcome! If you have suggestions, feel free to open an issue or a pull request.

```bash
git clone https://github.com/thib3113/nut.git
cd nut
pnpm install
pnpm run build
pnpm run test
```

## License

[MIT](https://github.com/thib3113/nut/blob/main/LICENSE)
