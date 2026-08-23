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
    const tierWeight = ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.modelId === model)?.creditWeight
    if (!isNil(tierWeight)) {
        return tierWeight
    }
    return MANAGED_MODEL_WEIGHTS[model] ?? 2
}

const MANAGED_MODEL_WEIGHTS: Record<string, number> = {
    'ai21/jamba-large-1.7': 6,
    'amazon/nova-premier-v1': 6,
    'anthropic/claude-fable-5': 45,
    'anthropic/claude-opus-4': 45,
    'anthropic/claude-opus-4.1': 45,
    'anthropic/claude-opus-4.5': 20,
    'anthropic/claude-opus-4.6': 20,
    'anthropic/claude-opus-4.7': 20,
    'anthropic/claude-opus-4.7-fast': 200,
    'anthropic/claude-opus-4.8-fast': 45,
    'anthropic/claude-opus-5': 20,
    'anthropic/claude-opus-5-fast': 45,
    'anthropic/claude-sonnet-4': 10,
    'anthropic/claude-sonnet-4.5': 10,
    'anthropic/claude-sonnet-5': 6,
    'cohere/command-a': 6,
    'cohere/command-r-plus-08-2024': 6,
    'google/gemini-2.5-pro': 6,
    'google/gemini-2.5-pro-preview': 6,
    'google/gemini-2.5-pro-preview-05-06': 6,
    'google/gemini-3-pro-image': 6,
    'google/gemini-3-pro-image-preview': 6,
    'google/gemini-3.1-pro-preview': 6,
    'google/gemini-3.1-pro-preview-customtools': 6,
    'google/gemini-3.5-flash': 6,
    'google/gemini-3.6-flash': 6,
    'mistralai/mistral-medium-3-5': 6,
    'moonshotai/kimi-k3': 10,
    'openai/gpt-4': 45,
    'openai/gpt-4-turbo': 20,
    'openai/gpt-4-turbo-preview': 20,
    'openai/gpt-4.1': 6,
    'openai/gpt-4o': 6,
    'openai/gpt-4o-2024-05-13': 10,
    'openai/gpt-4o-2024-08-06': 6,
    'openai/gpt-4o-2024-11-20': 6,
    'openai/gpt-5': 6,
    'openai/gpt-5-image': 6,
    'openai/gpt-5-pro': 90,
    'openai/gpt-5.1': 6,
    'openai/gpt-5.1-codex': 6,
    'openai/gpt-5.1-codex-max': 6,
    'openai/gpt-5.2': 10,
    'openai/gpt-5.2-chat': 10,
    'openai/gpt-5.2-codex': 10,
    'openai/gpt-5.2-pro': 200,
    'openai/gpt-5.3-chat': 10,
    'openai/gpt-5.3-codex': 10,
    'openai/gpt-5.4': 10,
    'openai/gpt-5.4-image-2': 10,
    'openai/gpt-5.4-pro': 200,
    'openai/gpt-5.5': 20,
    'openai/gpt-5.5-pro': 200,
    'openai/gpt-5.6-sol': 20,
    'openai/gpt-5.6-sol-pro': 20,
    'openai/gpt-audio': 6,
    'openai/gpt-chat-latest': 20,
    'openai/o1': 45,
    'openai/o1-pro': 500,
    'openai/o3': 6,
    'openai/o3-pro': 90,
    'perplexity/sonar-deep-research': 6,
    'perplexity/sonar-pro': 10,
    'perplexity/sonar-pro-search': 10,
    'perplexity/sonar-reasoning-pro': 6,
    'sakana/fugu-ultra': 20,
    '~anthropic/claude-fable-latest': 45,
    '~anthropic/claude-opus-latest': 20,
    '~anthropic/claude-sonnet-latest': 6,
    '~google/gemini-flash-latest': 6,
    '~google/gemini-pro-latest': 6,
    '~moonshotai/kimi-latest': 10,
    '~openai/gpt-latest': 20,
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
