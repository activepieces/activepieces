import pino, { Level, Logger } from 'pino'
import 'pino-loki'
import { system } from './system/system'
import { SharedSystemProp } from './system/system-prop'

const lokiUrl = system.get(SharedSystemProp.LOKI_URL)
const lokiUsername = system.get(SharedSystemProp.LOKI_USERNAME)
const lokiPassword = system.get(SharedSystemProp.LOKI_PASSWORD)

const initLogger = (): Logger => {
    const level = system.get<Level>(SharedSystemProp.LOG_LEVEL) ?? 'info'
    const pretty = system.getBoolean(SharedSystemProp.LOG_PRETTY) ?? false

    if (pretty) {
        return pino({
            level,
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    colorize: true,
                    ignore: 'pid,hostname',
                },
            },
        })
    }

    const targets = [
        {
            target: 'pino/file',
            level,
            options: {},
        },
    ]

    if (lokiUrl) {
        targets.push({
            target: 'pino-loki',
            level,
            options: {
                batching: true,
                interval: 5,
                host: lokiUrl,
                basicAuth:
          lokiPassword && lokiPassword
              ? {
                  username: lokiUsername,
                  password: lokiPassword,
              }
              : undefined,
            },
        })
    }

    return pino({ level, transport: { targets } })
}

export const logger = initLogger()
