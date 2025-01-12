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

`nut-client` is a Node.js client for **Network UPS Tools (NUT)**, enabling advanced communication with NUT servers for UPS management. It is built to be robust, performant, and easy to integrate, supporting parallel requests and event-based monitoring via Promises.

## Installation

```bash
npm install nut-client
```

## Features

- **NUT Command Support** : Most NUT commands are supported, with automatic parsing of responses to simplify integration. Additionally, a manual mode is available for full control.

  ```ts
  import { NUTClient } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493);

  console.log(client.listUPS());
  console.log(client.listVariables('ups'));

  //manual command
  console.log(client.send(['LOGIN', "myups"]))
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

- **StartTLS Support** : Communicate securely with the NUT server using StartTLS for encryption.

  ```javascript

  import { NUTClient } from 'nut-client'

  const client = new NUTClient('127.0.0.1', 3493);

  //use clear tcp connection
  console.log(await client.version());

  await client.startTLS({
    // allow self signed certificate
    rejectUnauthorized: false
  });

  //use encrypted tcp connection
  console.log(await client.version());
  ```

- **Built-in Monitor** : A `Monitor` module reads variables at regular intervals, emitting UPS events similar to `upsmon` (plus some additional ones).

  ```typescript
  const client = new NUTClient('127.0.0.1', 3493);
  const monitor = new Monitor(client, 'myUps');

  //use events like UPSMON
  monitor.on('ONBATT', () => {
    console.log('UPS "myUps" lost power and is now on battery');
  });

  // listen on specific variable changed
  monitor.on('VARIABLE_CHANGED', (key: string, oldValue: number, newValue: number) => {
    if(key !== "battery.charge" || isNaN(oldValue) || isNaN(newValue)) {
      return;
    }

    console.log(`battery is ${oldValue > newValue ? 'dis':''}charging`)
  })

  // listen on all events
  monitor.on('*', (event: string, ...args) => {
    console.log(`receive event ${event} with args`, args);
  })

  // other events available in the technical documentation
  // https://thib3113.github.io/nut/interfaces/IMonitorEvents.html

  await monitor.start();
  ```

- **Fully Typed with TypeScript (ESM + CJS)** : Built with TypeScript, `nut-client` is distributed in both ESM and CommonJS modules for maximum compatibility.

## Debug
this library include [debug](https://www.npmjs.com/package/debug), to debug, you can set the env variable :
````dotenv
DEBUG=nut-client:*
````


## Contributing

Contributions are welcome! If you have suggestions, feel free to open an issue or a pull request.
