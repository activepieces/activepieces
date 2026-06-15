import { apVersionUtil, evlogSetup } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { AppSystemProp, environmentVariables } from '../system/system-props'

let globalFacade: FastifyBaseLogger | undefined

function buildFacade(): FastifyBaseLogger {
    const logLevel = environmentVariables.getEnvironment(AppSystemProp.LOG_LEVEL) ?? 'info'
    const logPretty = environmentVariables.getEnvironment(AppSystemProp.LOG_PRETTY) === 'true'
    const sampleRateRaw = environmentVariables.getEnvironment(AppSystemProp.LOG_SAMPLE_RATE_INFO)
    const sampleRateInfo = sampleRateRaw !== undefined ? parseInt(sampleRateRaw, 10) : 100
    const keepSlowMsRaw = environmentVariables.getEnvironment(AppSystemProp.LOG_KEEP_SLOW_MS)
    const keepSlowMs = keepSlowMsRaw !== undefined ? parseInt(keepSlowMsRaw, 10) : 2000

    return evlogSetup.init({
        params: {
            serviceName: 'activepieces-api',
            version: apVersionUtil.getCurrentRelease(),
            logLevel,
            logPretty,
            sampleRateInfo,
            keepSlowMs,
            drainConfig: {
                serviceName: 'activepieces-api',
                hyperdxToken: environmentVariables.getEnvironment(AppSystemProp.HYPERDX_TOKEN),
                axiomToken: environmentVariables.getEnvironment(AppSystemProp.AXIOM_TOKEN),
                axiomDataset: environmentVariables.getEnvironment(AppSystemProp.AXIOM_DATASET),
                lokiUrl: environmentVariables.getEnvironment(AppSystemProp.LOKI_URL),
                lokiUsername: environmentVariables.getEnvironment(AppSystemProp.LOKI_USERNAME),
                lokiPassword: environmentVariables.getEnvironment(AppSystemProp.LOKI_PASSWORD),
                betterstackToken: environmentVariables.getEnvironment(AppSystemProp.BETTERSTACK_TOKEN),
                betterstackHost: environmentVariables.getEnvironment(AppSystemProp.BETTERSTACK_HOST),
                otlpEnabled: environmentVariables.getEnvironment(AppSystemProp.OTEL_ENABLED) === 'true',
            },
        },
    })
}

export const pinoLogging = {
    initLogger(): FastifyBaseLogger {
        if (globalFacade === undefined) {
            globalFacade = buildFacade()
        }
        return globalFacade
    },
    createRunContextLog({ log, runId, webhookId, flowId, flowVersionId }: { log: FastifyBaseLogger, runId: string, webhookId: string | undefined, flowId: string, flowVersionId: string }): FastifyBaseLogger {
        return log.child({ runId, webhookId, flowId, flowVersionId })
    },
    createWebhookContextLog({ log, webhookId, flowId }: { log: FastifyBaseLogger, webhookId: string, flowId: string }): FastifyBaseLogger {
        return log.child({ webhookId, flowId })
    },
}
