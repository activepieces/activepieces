import pino, { Logger, Level } from 'pino'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'

export const captureException = (error: unknown): void => {
    logger.error(error)
}

const initLogger = (): Logger => {
    const level = system.get<Level>(SystemProp.LOG_LEVEL) ?? 'info'
    const pretty = system.getBoolean(SystemProp.LOG_PRETTY) ?? false

    const transport = pretty
        ? {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                colorize: true,
                ignore: 'pid,hostname',
            },
        }
        : undefined

    return pino({
        level,
        transport,
    })
}

export const logger = initLogger()
