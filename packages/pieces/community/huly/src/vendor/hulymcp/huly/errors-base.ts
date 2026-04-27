/**
 * Base error types for Huly MCP server.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Base Huly error - generic operational error.
 */
export class HulyError extends Schema.TaggedError<HulyError>()("HulyError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Defect)
}) {}

/**
 * Connection error - network/transport failures.
 */
export class HulyConnectionError extends Schema.TaggedError<HulyConnectionError>()(
  "HulyConnectionError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect)
  }
) {}

/**
 * Authentication error - invalid credentials or expired session.
 */
export class HulyAuthError extends Schema.TaggedError<HulyAuthError>()(
  "HulyAuthError",
  {
    message: Schema.String
  }
) {}
