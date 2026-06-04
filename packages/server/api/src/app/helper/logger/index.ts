import { loggerRedact } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import pino, { Level, Logger } from 'pino'
import { AppSystemProp, environmentVariables } from '../system/system-props'
import { transportProviders } from './transports'
import { resolveTransport } from './transports/transport-provider'

export const pinoLogging = {
    initLogger: (): Logger => {
        const level: Level = (environmentVariables.getEnvironment(AppSystemProp.LOG_LEVEL) as Level) ?? 'info'
        const pretty = environmentVariables.getEnvironment(AppSystemProp.LOG_PRETTY) === 'true'

        if (pretty) {
            return pino({
                level,
                redact: loggerRedact,
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

        const transportLogger = resolveTransport(transportProviders, level, defaultTargets)
        if (transportLogger) {
            return transportLogger
        }

        return pino({
            level,
            redact: loggerRedact,
            transport: {
                targets: defaultTargets,
            },
        })
    },
    createRunContextLog: ({ log, runId, webhookId, flowId, flowVersionId }: { log: FastifyBaseLogger, runId: string, webhookId: string | undefined, flowId: string, flowVersionId: string }) => {
        return log.child({ runId, webhookId, flowId, flowVersionId })
    },
    createWebhookContextLog: ({ log, webhookId, flowId }: { log: FastifyBaseLogger, webhookId: string, flowId: string }) => {
        return log.child({ webhookId, flowId })
    },
}
