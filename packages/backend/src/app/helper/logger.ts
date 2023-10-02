import pino, { Logger, Level } from 'pino'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'

export const captureException = (error: unknown): void => {
    logger.error(error)
}

const lokiUrl = system.get(SystemProp.LOKI_URL)
const lokiUsername = system.get(SystemProp.LOKI_USERNAME)
const lokiPassword = system.get(SystemProp.LOKI_PASSWORD)

const initLogger = (): Logger => {
    const level = system.get<Level>(SystemProp.LOG_LEVEL) ?? 'info'
    const pretty = system.getBoolean(SystemProp.LOG_PRETTY) ?? false

    const targets = []
    if (pretty) {
        targets.push({
            level,
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                colorize: true,
                ignore: 'pid,hostname',
            },
        })
    }
    if (lokiUrl) {
        targets.push({
            target: 'pino-loki',
            level,
            options: {
                batching: true,
                interval: 5,
                host: lokiUrl,
                basicAuth: {
                    username: lokiUsername!,
                    password: lokiPassword!,
                },
            },
        })
        targets.push({
            target: 'pino/file',
            level,
            options: {},
        })
    }
    return pino({
        level,
        transport: pino.transport({
            targets,
        }),
    })
}

export const logger = initLogger()
