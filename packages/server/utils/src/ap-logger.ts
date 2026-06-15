import { log } from 'evlog'
import { wideEvent } from './wide-event'

// Module-level log level — updated by evlog-setup when init is called.
let currentLevel = 'info'

function setCurrentLevel(level: string): void {
    currentLevel = level
}

function getCurrentLevel(): string {
    return currentLevel
}

function create({ bindings }: { bindings?: Record<string, unknown> } = {}): ApLogger {
    return buildLogger(bindings ?? {})
}

function buildLogger(bindings: Record<string, unknown>): ApLogger {
    return {
        get level() {
            return getCurrentLevel()
        },
        set level(_v: string) {
            // no-op: level is managed by evlogSetup
        },
        silent() {
            // no-op
        },
        info(...args: unknown[]) {
            try {
                const { message, fields } = normalizePinoArgs(args)
                const wide = wideEvent.current()
                if (wide) {
                    wide.info(message ?? 'log', { ...bindings, ...fields })
                }
                else {
                    log.info({ msg: message, ...bindings, ...fields })
                }
            }
            catch {
                // never throw
            }
        },
        warn(...args: unknown[]) {
            try {
                const { message, fields } = normalizePinoArgs(args)
                const wide = wideEvent.current()
                if (wide) {
                    wide.warn(message ?? 'log', { ...bindings, ...fields })
                }
                else {
                    log.warn({ msg: message, ...bindings, ...fields })
                }
            }
            catch {
                // never throw
            }
        },
        error(...args: unknown[]) {
            try {
                const { message, fields, err } = normalizePinoArgsWithError(args)
                const wide = wideEvent.current()
                if (wide) {
                    // RequestLogger.error accepts Error | string — message-only calls
                    // must still land at error level (alerting keys on it).
                    wide.error(err ?? message ?? 'error', { ...bindings, ...fields })
                }
                else {
                    if (err) {
                        log.error({ msg: message ?? err.message, err: `${err.message}\n${err.stack ?? ''}`, ...bindings, ...fields })
                    }
                    else {
                        log.error({ msg: message, ...bindings, ...fields })
                    }
                }
            }
            catch {
                // never throw
            }
        },
        fatal(...args: unknown[]) {
            try {
                const { message, fields, err } = normalizePinoArgsWithError(args)
                const wide = wideEvent.current()
                if (wide) {
                    wide.error(err ?? message ?? 'fatal', { ...bindings, ...fields })
                }
                else {
                    if (err) {
                        log.error({ msg: message ?? err.message, err: `${err.message}\n${err.stack ?? ''}`, ...bindings, ...fields })
                    }
                    else {
                        log.error({ msg: message, ...bindings, ...fields })
                    }
                }
            }
            catch {
                // never throw
            }
        },
        debug(...args: unknown[]) {
            try {
                const { message, fields } = normalizePinoArgs(args)
                log.debug({ msg: message, ...bindings, ...fields })
            }
            catch {
                // never throw
            }
        },
        trace(...args: unknown[]) {
            try {
                const { message, fields } = normalizePinoArgs(args)
                log.debug({ msg: message, ...bindings, ...fields })
            }
            catch {
                // never throw
            }
        },
        child(childBindings: Record<string, unknown>): ApLogger {
            wideEvent.set(childBindings)
            return create({ bindings: { ...bindings, ...childBindings } })
        },
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizePinoArgs(args: unknown[]): { message: string | undefined, fields: Record<string, unknown> } {
    const first = args[0]
    if (typeof first === 'string') {
        return { message: first, fields: {} }
    }
    if (isRecord(first)) {
        const second = args[1]
        const message = typeof second === 'string' ? second : undefined
        return { message, fields: first }
    }
    return { message: String(first ?? ''), fields: {} }
}

function normalizePinoArgsWithError(args: unknown[]): { message: string | undefined, fields: Record<string, unknown>, err: Error | undefined } {
    const first = args[0]

    // Direct Error as first arg
    if (first instanceof Error) {
        const second = args[1]
        const message = typeof second === 'string' ? second : undefined
        return { message, fields: {}, err: first }
    }

    if (isRecord(first)) {
        const second = args[1]
        const message = typeof second === 'string' ? second : undefined

        // pino convention: obj.err or obj.error as Error
        const errField = first['err'] ?? first['error']
        if (errField instanceof Error) {
            const { err: _err, error: _error, ...rest } = first
            void _err
            void _error
            return { message, fields: rest, err: errField }
        }
        return { message, fields: first, err: undefined }
    }
    if (typeof first === 'string') {
        return { message: first, fields: {}, err: undefined }
    }
    return { message: undefined, fields: {}, err: undefined }
}

export const apLogger = {
    create,
    setCurrentLevel,
}

// Interface matching pino's BaseLogger surface, structural substitute for FastifyBaseLogger.
// Defined here so this package does not need fastify or pino as a dependency.
export interface ApLogger {
    level: string
    silent(): void
    info(...args: unknown[]): void
    warn(...args: unknown[]): void
    error(...args: unknown[]): void
    fatal(...args: unknown[]): void
    debug(...args: unknown[]): void
    trace(...args: unknown[]): void
    child(bindings: Record<string, unknown>): ApLogger
}
