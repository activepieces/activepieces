import { FastifyBaseLogger } from 'fastify'
import pino, { Level, Logger } from 'pino'
import 'pino-loki'
import { createHyperDXTransport, HyperDXCredentials } from './hyperdx-pino'
import { createLokiTransport, LokiCredentials } from './loki-pino'

export const pinoLogging = {
    initLogger: (loggerLevel: Level | undefined, logPretty: boolean, loki: LokiCredentials, hyperdx: HyperDXCredentials): Logger => {
        const level: Level = loggerLevel ?? 'info'
        const pretty = logPretty ?? false

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

        const hyperdxLogger = createHyperDXTransport(level, defaultTargets, hyperdx)
        if (hyperdxLogger) {
            return hyperdxLogger
        }

        const lokiLogger = createLokiTransport(level, defaultTargets, loki)
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
    },
    createRunContextLog: ({ log, flowRunId, webhookId, flowId, flowVersionId }: { log: FastifyBaseLogger, flowRunId: string, webhookId: string | undefined, flowId: string, flowVersionId: string }) => {
        return log.child({ flowRunId, webhookId, flowId, flowVersionId })
    },
    createWebhookContextLog: ({ log, webhookId, flowId }: { log: FastifyBaseLogger, webhookId: string, flowId: string }) => {
        return log.child({ webhookId, flowId })
    },
}
