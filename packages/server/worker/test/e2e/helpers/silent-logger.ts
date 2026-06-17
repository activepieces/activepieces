import { ApLogger } from '@activepieces/server-utils'

export function silentLogger(): ApLogger {
    const noop = () => undefined
    const level = process.env['E2E_LOG_LEVEL'] ?? 'silent'
    const self: ApLogger = {
        get level() { return level },
        set level(_v) { /* no-op */ },
        silent: noop,
        info: noop,
        warn: noop,
        error: noop,
        fatal: noop,
        debug: noop,
        trace: noop,
        child(): ApLogger { return self },
    }
    return self
}
