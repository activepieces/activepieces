import { initLogger, RedactConfig } from 'evlog'
import { apLogger, ApLogger } from './ap-logger'
import { evlogDrains, EvlogDrainConfig } from './evlog-drains'

// Module-level flush function; replaced each time init() is called.
let activeFlusher: (() => Promise<void>) = async () => undefined

// Evlog does not support trace/fatal natively; map to nearest equivalents.
const LEVEL_MAP: Record<string, string> = {
    trace: 'debug',
    fatal: 'error',
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
}

// Exact dot-notation paths ported from logger-redact.ts.
// Pino wildcard paths (*.x, *.*.x) are expanded to common nesting levels used
// in the existing pino redact list. Patterns are NOT used because evlog patterns
// match values (regex over string values) — not key names.
const PORTED_REDACT_PATHS = [
    // HTTP headers
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers.x-api-key',
    'req.headers.set-cookie',
    'res.headers.set-cookie',

    // password
    'password',
    'body.password',
    'data.password',
    'user.password',
    'params.password',
    'currentPassword',
    'body.currentPassword',
    'data.currentPassword',
    'newPassword',
    'body.newPassword',
    'data.newPassword',
    'newPasswordConfirmation',
    'body.newPasswordConfirmation',
    'data.newPasswordConfirmation',

    // tokens
    'token',
    'body.token',
    'data.token',
    'accessToken',
    'body.accessToken',
    'data.accessToken',
    'access_token',
    'body.access_token',
    'data.access_token',
    'refreshToken',
    'body.refreshToken',
    'data.refreshToken',
    'refresh_token',
    'body.refresh_token',
    'data.refresh_token',
    'idToken',
    'body.idToken',
    'data.idToken',
    'id_token',
    'body.id_token',
    'data.id_token',

    // API keys + secrets
    'apiKey',
    'body.apiKey',
    'data.apiKey',
    'api_key',
    'body.api_key',
    'data.api_key',
    'secret',
    'body.secret',
    'data.secret',
    'clientSecret',
    'body.clientSecret',
    'data.clientSecret',
    'client_secret',
    'body.client_secret',
    'data.client_secret',
    'privateKey',
    'body.privateKey',
    'data.privateKey',
    'private_key',
    'body.private_key',
    'data.private_key',

    // connection values
    'connection.value',
    'body.connection.value',
    'appConnection.value',
    'body.appConnection.value',
    'app_connection.value',
    'body.app_connection.value',
    'connectionValue',
    'body.connectionValue',
    'data.connectionValue',

    // axios error internals
    'err.response.data',
    'err.config.headers.authorization',
    'err.config.headers.Authorization',
    'err.request._header',
]

const REDACT_CONFIG: RedactConfig = {
    paths: PORTED_REDACT_PATHS,
    // Disable built-in PII patterns to avoid over-redacting business IDs,
    // versions, and other numeric/string fields. Explicit paths above cover
    // the secrets that matter in this codebase.
    builtins: false,
    replacement: '[REDACTED]',
}

function init({ params }: { params: EvlogSetupParams }): ApLogger {
    const mappedLevel = LEVEL_MAP[params.logLevel ?? 'info'] ?? 'info'

    const resolved = evlogDrains.resolve({ config: params.drainConfig })
    activeFlusher = resolved.flush

    initLogger({
        env: { service: params.drainConfig.serviceName, version: params.version },
        pretty: params.logPretty ?? false,
        minLevel: mappedLevel as 'debug' | 'info' | 'warn' | 'error',
        sampling: {
            rates: {
                info: params.sampleRateInfo ?? 100,
                warn: 100,
                error: 100,
            },
            keep: [
                { status: 400 },
                { duration: params.keepSlowMs ?? 2000 },
            ],
        },
        redact: REDACT_CONFIG,
        drain: resolved.drain,
    })

    apLogger.setCurrentLevel(mappedLevel)

    return apLogger.create({})
}

async function flush(): Promise<void> {
    return activeFlusher()
}

export const evlogSetup = {
    init,
    flush,
}

export type EvlogSetupParams = {
    serviceName: string
    version?: string
    logLevel?: string
    logPretty?: boolean
    sampleRateInfo?: number
    keepSlowMs?: number
    drainConfig: EvlogDrainConfig
}
