// Centralized CJS require() interop for Huly platform plugins.
// These packages only expose CommonJS default exports; import() doesn't work at runtime.
// All requires are collected here so consumers import typed values without eslint suppression.

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports, no-restricted-syntax -- CJS interop boundary: require().default needs `as typeof import(…).default` */

export const activity = require("@hcengineering/activity").default as typeof import("@hcengineering/activity").default
export const attachment = require("@hcengineering/attachment")
  .default as typeof import("@hcengineering/attachment").default
export const calendar = require("@hcengineering/calendar")
  .default as typeof import("@hcengineering/calendar").default
export const cardPlugin = require("@hcengineering/card")
  .default as typeof import("@hcengineering/card").default
export const chunter = require("@hcengineering/chunter").default as typeof import("@hcengineering/chunter").default
export const contact = require("@hcengineering/contact").default as typeof import("@hcengineering/contact").default
export const core = require("@hcengineering/core").default as typeof import("@hcengineering/core").default
export const documentPlugin = require("@hcengineering/document")
  .default as typeof import("@hcengineering/document").default
export const notification = require("@hcengineering/notification")
  .default as typeof import("@hcengineering/notification").default
export const tags = require("@hcengineering/tags").default as typeof import("@hcengineering/tags").default
export const task = require("@hcengineering/task").default as typeof import("@hcengineering/task").default
export const time = require("@hcengineering/time").default as typeof import("@hcengineering/time").default
export const tracker = require("@hcengineering/tracker").default as typeof import("@hcengineering/tracker").default

/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports, no-restricted-syntax */
