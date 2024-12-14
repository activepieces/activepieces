import { FastifyBaseLogger } from 'fastify'
import pino, { Level, Logger } from 'pino'
import 'pino-loki'
import { system } from '../system/system'
import { SharedSystemProp } from '../system/system-prop'
import { createLokiTransport } from './loki-pino'

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

    const defaultTargets = [
        {
            target: 'pino/file',
            level,
            options: {},
        },
    ]

    const lokiLogger = createLokiTransport(level, defaultTargets)
    if (lokiLogger) {
        return lokiLogger
    }

    // Default logger
    return pino({
        level,
        transport: {
            targets: defaultTargets,
        },
    })
}

export const logger = initLogger()

export const createRunContextLog = ({ log, runId, webhookId, flowId, flowVersionId }: { log: FastifyBaseLogger, runId: string, webhookId: string | undefined, flowId: string, flowVersionId: string }) => {
    return log.child({ runId, webhookId, flowId, flowVersionId })
}

export const createWebhookContextLog = ({ log, webhookId, flowId }: { log: FastifyBaseLogger, webhookId: string, flowId: string }) => {
    return log.child({ webhookId, flowId })
}
