import { ApLogger } from '@activepieces/server-utils'

export const testLogger = {
    noop: createNoop(),
    createRecording,
}

function createNoop(): ApLogger {
    const log: ApLogger = {
        level: 'silent',
        silent: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
        child: () => log,
    }
    return log
}

function createRecording(): RecordingLog {
    const calls: LogCall[] = []
    const record = (level: LogLevel) => (...args: unknown[]) => {
        calls.push({ level, payload: args[0] })
    }
    const log: ApLogger = {
        level: 'debug',
        silent: () => undefined,
        info: record('info'),
        warn: record('warn'),
        error: record('error'),
        fatal: record('fatal'),
        debug: record('debug'),
        trace: record('trace'),
        child: () => log,
    }
    return {
        log,
        payloadsAt: (level: LogLevel) => calls.filter((call) => call.level === level).map((call) => call.payload),
    }
}

export type LogLevel = 'info' | 'warn' | 'error' | 'fatal' | 'debug' | 'trace'

export type RecordingLog = {
    log: ApLogger
    payloadsAt: (level: LogLevel) => unknown[]
}

type LogCall = {
    level: LogLevel
    payload: unknown
}
