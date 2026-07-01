import { AIProviderName, isNil } from '@activepieces/core-utils'
import { FileType, FlowRun, FlowVersion, LogSliceRef, PlanName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { BillingEvents, captureBillingEvent } from '../../helper/telemetry.utils'
import { CreditUsageSource, trackCreditsWithAppSumo } from '../../platform/billing-provider'
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
        const appSumoAiValue = usage.breakdown
            .filter((entry) => entry.provider === AIProviderName.ACTIVEPIECES)
            .reduce((sum, entry) => sum + entry.messages + entry.toolCalls, 0)
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(project.platformId)
        const isAppSumoPlan = platformPlan.plan?.toLowerCase().includes(PlanName.APPSUMO) ?? false
        await trackCreditsWithAppSumo({
            log,
            credits: {
                platformId: project.platformId,
                value: usage.messages + usage.toolCalls,
                source: CreditUsageSource.AI,
                idempotencyKey: `${flowRun.id}:ai`,
                properties: {
                    platformId: project.platformId,
                    projectId: flowRun.projectId,
                    flowId: flowRun.flowId,
                    flowRunId: flowRun.id,
                    environment: flowRun.environment,
                    messages: usage.messages,
                    toolCalls: usage.toolCalls,
                    breakdown: usage.breakdown,
                },
            },
            appSumo: appSumoAiValue > 0 && isAppSumoPlan ? {
                platformId: project.platformId,
                value: appSumoAiValue,
                idempotencyKey: `${flowRun.id}:appSumoAi`,
                properties: {
                    platformId: project.platformId,
                    projectId: flowRun.projectId,
                    flowId: flowRun.flowId,
                    flowRunId: flowRun.id,
                    environment: flowRun.environment,
                },
            } : undefined,
        })
        const licenseKey = platformPlan.licenseKey
        if (isNil(licenseKey) || licenseKey.length === 0) {
            return
        }
        captureBillingEvent({
            licenseKey,
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
        })
    },
})


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
