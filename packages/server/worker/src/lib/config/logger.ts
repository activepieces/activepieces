import { type ApLogger, apVersionUtil, evlogSetup } from '@activepieces/server-utils'
import { system, WorkerSystemProp } from './configs'

function buildLogger(): ApLogger {
    const logLevel = system.get(WorkerSystemProp.LOG_LEVEL) ?? 'info'
    const logPretty = system.getBoolean(WorkerSystemProp.LOG_PRETTY) ?? false
    const sampleRateRaw = system.get(WorkerSystemProp.LOG_SAMPLE_RATE_INFO)
    const sampleRateInfo = sampleRateRaw !== undefined ? parseInt(sampleRateRaw, 10) : 100
    const keepSlowMsRaw = system.get(WorkerSystemProp.LOG_KEEP_SLOW_MS)
    const keepSlowMs = keepSlowMsRaw !== undefined ? parseInt(keepSlowMsRaw, 10) : 2000

    return evlogSetup.init({
        params: {
            serviceName: 'activepieces-worker',
            version: apVersionUtil.getCurrentRelease(),
            logLevel,
            logPretty,
            sampleRateInfo,
            keepSlowMs,
            drainConfig: {
                serviceName: 'activepieces-worker',
                hyperdxToken: system.get(WorkerSystemProp.HYPERDX_TOKEN),
                axiomToken: system.get(WorkerSystemProp.AXIOM_TOKEN),
                axiomDataset: system.get(WorkerSystemProp.AXIOM_DATASET),
                lokiUrl: system.get(WorkerSystemProp.LOKI_URL),
                lokiUsername: system.get(WorkerSystemProp.LOKI_USERNAME),
                lokiPassword: system.get(WorkerSystemProp.LOKI_PASSWORD),
                betterstackToken: system.get(WorkerSystemProp.BETTERSTACK_TOKEN),
                betterstackHost: system.get(WorkerSystemProp.BETTERSTACK_HOST),
                otlpEnabled: system.getBoolean(WorkerSystemProp.OTEL_ENABLED) ?? false,
            },
        },
    })
}

export const logger: ApLogger = buildLogger()
