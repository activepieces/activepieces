/**
 * Configuration module for Huly MCP server.
 *
 * Loads config from environment variables.
 *
 * @module
 */
import type { ConfigError } from "effect"
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect"

const DEFAULT_TIMEOUT = 30000

/**
 * Schema for URL validation - must be valid http/https URL.
 */
const UrlSchema = Schema.String.pipe(
  Schema.filter((s) => {
    try {
      const url = new URL(s)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  }, { message: () => "Must be a valid http or https URL" })
)

/**
 * Schema for non-whitespace-only string.
 * Validates that the string is not empty after trimming.
 * Note: Does NOT transform the value - original string is preserved.
 */
const NonWhitespaceString = Schema.String.pipe(
  Schema.filter((s) => s.trim().length > 0, { message: () => "Must not be empty or whitespace-only" })
)

/**
 * Schema for positive integer (timeout in ms).
 * Used for direct validation (e.g., HulyConfigSchema).
 */
const PositiveInt = Schema.Number.pipe(
  Schema.int({ message: () => "Must be an integer" }),
  Schema.positive({ message: () => "Must be positive" })
)

/**
 * Schema for positive integer from string (for env vars).
 */
const PositiveIntFromString = Schema.NumberFromString.pipe(
  Schema.int({ message: () => "Must be an integer" }),
  Schema.positive({ message: () => "Must be positive" })
)

const TokenAuthSchema = Schema.Struct({
  _tag: Schema.Literal("token"),
  token: Schema.Redacted(NonWhitespaceString)
})

const PasswordAuthSchema = Schema.Struct({
  _tag: Schema.Literal("password"),
  email: NonWhitespaceString,
  password: Schema.Redacted(NonWhitespaceString)
})

const AuthSchema = Schema.Union(TokenAuthSchema, PasswordAuthSchema)

export type Auth = Schema.Schema.Type<typeof AuthSchema>

/**
 * Full configuration schema.
 */
export const HulyConfigSchema = Schema.Struct({
  url: UrlSchema,
  auth: AuthSchema,
  workspace: NonWhitespaceString,
  connectionTimeout: PositiveInt
})

type HulyConfig = Schema.Schema.Type<typeof HulyConfigSchema>

export class ConfigValidationError extends Schema.TaggedError<ConfigValidationError>()(
  "ConfigValidationError",
  {
    message: Schema.String,
    field: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Defect)
  }
) {}

const TokenAuthFromEnv = Config.map(
  Schema.Config("HULY_TOKEN", Schema.Redacted(NonWhitespaceString)),
  (token): Auth => ({ _tag: "token", token })
)

const PasswordAuthFromEnv = Config.map(
  Config.all({
    email: Schema.Config("HULY_EMAIL", NonWhitespaceString),
    password: Schema.Config("HULY_PASSWORD", Schema.Redacted(NonWhitespaceString))
  }),
  ({ email, password }): Auth => ({ _tag: "password", email, password })
)

const AuthFromEnv = TokenAuthFromEnv.pipe(Config.orElse(() => PasswordAuthFromEnv))

/**
 * Config definition using Effect's Config module.
 * Uses Schema.Config for consistent validation with NonWhitespaceString.
 */
const HulyConfigFromEnv = Config.all({
  url: Schema.Config("HULY_URL", UrlSchema),
  auth: AuthFromEnv,
  workspace: Schema.Config("HULY_WORKSPACE", NonWhitespaceString),
  connectionTimeout: Schema.Config("HULY_CONNECTION_TIMEOUT", PositiveIntFromString).pipe(
    Config.withDefault(DEFAULT_TIMEOUT)
  )
})

const loadConfig: Effect.Effect<HulyConfig, ConfigValidationError> = HulyConfigFromEnv.pipe(
  Effect.mapError((e) =>
    new ConfigValidationError({
      message: `Configuration error: ${e.message}`,
      field: extractFieldFromConfigError(e),
      cause: e
    })
  )
)

const extractFieldFromConfigError = (error: ConfigError.ConfigError): string | undefined => {
  const message = error.message
  // Try to extract key name from message like "Expected HULY_URL to exist..."
  const match = message.match(/Expected\s+(\w+)\s+to/)
  return match?.[1]
}

export class HulyConfigService extends Context.Tag("@hulymcp/HulyConfig")<
  HulyConfigService,
  HulyConfig
>() {
  static readonly DEFAULT_TIMEOUT = DEFAULT_TIMEOUT

  static readonly layer: Layer.Layer<HulyConfigService, ConfigValidationError> = Layer.effect(
    HulyConfigService,
    loadConfig
  )

  /** Bypasses validation - for testing only. */
  static testLayer(config: {
    url: string
    email: string
    password: string
    workspace: string
    connectionTimeout?: number
  }): Layer.Layer<HulyConfigService> {
    return Layer.succeed(HulyConfigService, {
      url: config.url,
      auth: { _tag: "password", email: config.email, password: Redacted.make(config.password) },
      workspace: config.workspace,
      connectionTimeout: config.connectionTimeout ?? DEFAULT_TIMEOUT
    })
  }

  /** Bypasses validation - for testing only. */
  static testLayerToken(config: {
    url: string
    token: string
    workspace: string
    connectionTimeout?: number
  }): Layer.Layer<HulyConfigService> {
    return Layer.succeed(HulyConfigService, {
      url: config.url,
      auth: { _tag: "token", token: Redacted.make(config.token) },
      workspace: config.workspace,
      connectionTimeout: config.connectionTimeout ?? DEFAULT_TIMEOUT
    })
  }
}
