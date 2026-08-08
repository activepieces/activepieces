import { AIProviderName, isNil } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, FileType, FlowRun, FlowVersion, isAppSumoCreditedPlan, LogSliceRef } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { BillingEvents } from '../../helper/telemetry.utils'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { AiCreditConsumptionProperties, CreditUsageSource, toFlowRunCreditProperties } from '../../platform/billing-provider'
import { projectService } from '../../project/project-service'
import { flowRunAiUsageExtractor } from './flow-run-ai-usage-extractor'
import { flowRunService } from './flow-run-service'

export const flowRunAiUsageTracker = (log: FastifyBaseLogger) => ({
    async track({ flowRun, flowVersion }: TrackParams): Promise<void> {
        if (!flowRunAiUsageExtractor.flowVersionHasAiStep(flowVersion)) {
            return
        }
        const project = await projectService(log).getOne(flowRun.projectId)
        if (isNil(project)) {
            return
        }
        const steps = await flowRunService(log).getStepsOrNull({ flowRun })
        if (isNil(steps)) {
            return
        }
        const usage = await flowRunAiUsageExtractor.extractAiUsage({
            steps,
            flowVersion,
            stepNameToTest: flowRun.stepNameToTest,
            fetchSlice: (ref) => fetchSlice({ log, projectId: flowRun.projectId, ref }),
        })
        if (usage.messages === 0 && usage.toolCalls === 0) {
            return
        }
        const creditValue = usage.breakdown.reduce((sum, entry) => sum + entry.messages * resolveAiCreditWeight({ provider: entry.provider, model: entry.model }) + entry.toolCalls, 0)
        const attempt = flowRun.startTime ?? flowRun.created
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(project.platformId)
        const isAppSumoPlan = isAppSumoCreditedPlan(platformPlan.plan)
        const aiProperties: AiCreditConsumptionProperties = {
            ...toFlowRunCreditProperties({ platformId: project.platformId, flowRun }),
            messages: usage.messages,
            toolCalls: usage.toolCalls,
            breakdown: usage.breakdown,
        }
        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: {
                platformId: project.platformId,
                value: creditValue,
                source: CreditUsageSource.AI,
                idempotencyKey: `${flowRun.id}:ai:${attempt}`,
                properties: aiProperties,
            },
            appSumo: creditValue > 0 && isAppSumoPlan ? {
                platformId: project.platformId,
                value: creditValue,
                source: CreditUsageSource.AI,
                idempotencyKey: `${flowRun.id}:appSumoAi:${attempt}`,
                properties: aiProperties,
            } : undefined,
            telemetry: {
                event: BillingEvents.AI_USAGE_PER_RUN,
                properties: {
                    platformId: project.platformId,
                    projectId: flowRun.projectId,
                    edition: system.getEdition(),
                    flowRunId: flowRun.id,
                    flowId: flowRun.flowId,
                    status: flowRun.status,
                    environment: flowRun.environment,
                    messages: usage.messages,
                    toolCalls: usage.toolCalls,
                    breakdown: usage.breakdown,
                },
            },
        })
    },
})


function resolveAiCreditWeight({ provider, model }: { provider: string, model: string }): number {
    if (provider !== AIProviderName.ACTIVEPIECES) {
        return 1
    }
    return ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.modelId === model)?.creditWeight ?? 2
}


async function fetchSlice({ log, projectId, ref }: FetchSliceParams): Promise<unknown> {
    const file = await fileService(log).getDataOrUndefined({
        projectId,
        fileId: ref.fileId,
        type: FileType.FLOW_RUN_LOG_SLICE,
    })
    if (isNil(file)) {
        return undefined
    }
    return JSON.parse(file.data.toString('utf-8'))
}


type TrackParams = {
    flowRun: FlowRun
    flowVersion: FlowVersion
}

type FetchSliceParams = {
    log: FastifyBaseLogger
    projectId: string
    ref: LogSliceRef
}
