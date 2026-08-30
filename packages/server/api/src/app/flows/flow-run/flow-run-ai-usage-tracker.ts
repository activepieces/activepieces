import { AIProviderName, isNil } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, DEFAULT_CHAT_TIER_ID, FileType, FlowRun, FlowVersion, isAppSumoCreditedPlan, LogSliceRef } from '@activepieces/shared'
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
    if (model === flowRunAiUsageExtractor.UNRESOLVED_VALUE) {
        return defaultTierCreditWeight()
    }
    return MANAGED_MODEL_WEIGHTS[model] ?? UNPRICED_MODEL_CREDIT_WEIGHT
}

function defaultTierCreditWeight(): number {
    const defaultTier = ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.id === DEFAULT_CHAT_TIER_ID) ?? ACTIVEPIECES_CHAT_TIERS[0]
    return defaultTier.creditWeight
}

const UNPRICED_MODEL_CREDIT_WEIGHT = 100

const MANAGED_MODEL_WEIGHTS: Record<string, number> = {
    '~anthropic/claude-fable-latest': 193,
    '~anthropic/claude-haiku-latest': 10,
    '~anthropic/claude-opus-latest': 79,
    '~anthropic/claude-sonnet-latest': 41,
    '~deepseek/deepseek-v4-flash-latest': 3,
    '~google/gemini-flash-latest': 7,
    '~google/gemini-pro-latest': 28,
    '~moonshotai/kimi-latest': 9,
    '~openai/gpt-latest': 25,
    '~openai/gpt-mini-latest': 8,
    '~x-ai/grok-latest': 19,
    '~z-ai/glm-latest': 12,
    'amazon/nova-premier-v1': 33,
    'anthropic/claude-fable-5': 193,
    'anthropic/claude-haiku-4.5': 10,
    'anthropic/claude-opus-4': 325,
    'anthropic/claude-opus-4.1': 325,
    'anthropic/claude-opus-4.1:batch': 133,
    'anthropic/claude-opus-4.5': 79,
    'anthropic/claude-opus-4.6': 79,
    'anthropic/claude-opus-4.7': 79,
    'anthropic/claude-opus-4.7-fast': 792,
    'anthropic/claude-opus-4.8': 80,
    'anthropic/claude-opus-4.8-fast': 193,
    'anthropic/claude-opus-5': 79,
    'anthropic/claude-opus-5-fast': 193,
    'anthropic/claude-sonnet-4': 41,
    'anthropic/claude-sonnet-4.5': 41,
    'anthropic/claude-sonnet-4.6': 40,
    'anthropic/claude-sonnet-5': 25,
    'cohere/command-a': 29,
    'cohere/command-r-plus-08-2024': 29,
    'deepseek/deepseek-chat-v3.1': 2,
    'deepseek/deepseek-v3.1-terminus': 2,
    'deepseek/deepseek-v3.2': 1,
    'deepseek/deepseek-v3.2-exp': 2,
    'deepseek/deepseek-v4-flash': 1,
    'deepseek/deepseek-v4-flash-0731': 3,
    'deepseek/deepseek-v4-pro': 13,
    'dots-studio/dots-3-note-preview:free': 1,
    'google/gemini-2.5-flash': 4,
    'google/gemini-2.5-flash-image': 4,
    'google/gemini-2.5-flash-lite': 1,
    'google/gemini-2.5-flash-lite:batch': 1,
    'google/gemini-2.5-flash:batch': 2,
    'google/gemini-2.5-pro': 19,
    'google/gemini-2.5-pro-preview': 19,
    'google/gemini-2.5-pro-preview-05-06': 19,
    'google/gemini-2.5-pro:batch': 8,
    'google/gemini-3-flash-preview': 5,
    'google/gemini-3-flash-preview:batch': 2,
    'google/gemini-3-pro-image': 28,
    'google/gemini-3-pro-image-preview': 28,
    'google/gemini-3.1-flash-image': 5,
    'google/gemini-3.1-flash-lite': 2,
    'google/gemini-3.1-flash-lite-image': 2,
    'google/gemini-3.1-flash-lite:batch': 1,
    'google/gemini-3.1-pro-preview': 28,
    'google/gemini-3.1-pro-preview-customtools': 28,
    'google/gemini-3.1-pro-preview:batch': 12,
    'google/gemini-3.5-flash': 19,
    'google/gemini-3.5-flash-lite': 4,
    'google/gemini-3.5-flash-lite:batch': 2,
    'google/gemini-3.5-flash:batch': 8,
    'google/gemini-3.6-flash': 7,
    'google/gemini-3.6-flash:batch': 3,
    'google/gemini-3.7-flash': 7,
    'google/gemini-3.7-flash:batch': 2,
    'google/gemma-4-26b-a4b-it': 1,
    'kwaipilot/kat-coder-pro-v2': 2,
    'kwaipilot/kat-coder-pro-v2.5': 6,
    'meituan/longcat-2.0': 2,
    'meta-llama/llama-3.3-70b-instruct': 4,
    'meta-llama/llama-4-maverick': 3,
    'meta-llama/llama-4-scout': 2,
    'minimax/minimax-m2': 2,
    'minimax/minimax-m2.5': 2,
    'minimax/minimax-m2.7': 2,
    'minimax/minimax-m3': 2,
    'mistralai/mistral-medium-3-5': 17,
    'moonshotai/kimi-k2-thinking': 5,
    'moonshotai/kimi-k2.5': 5,
    'moonshotai/kimi-k2.6': 9,
    'moonshotai/kimi-k3': 41,
    'openai/gpt-3.5-turbo': 4,
    'openai/gpt-3.5-turbo-16k': 23,
    'openai/gpt-3.5-turbo-instruct': 10,
    'openai/gpt-4': 501,
    'openai/gpt-4-turbo': 145,
    'openai/gpt-4-turbo-preview': 145,
    'openai/gpt-4.1': 22,
    'openai/gpt-4.1-mini': 3,
    'openai/gpt-4.1-nano': 1,
    'openai/gpt-4o': 29,
    'openai/gpt-4o-2024-05-13': 60,
    'openai/gpt-4o-2024-08-06': 29,
    'openai/gpt-4o-2024-11-20': 29,
    'openai/gpt-4o-mini': 1,
    'openai/gpt-4o-mini-2024-07-18': 1,
    'openai/gpt-5': 19,
    'openai/gpt-5-image': 100,
    'openai/gpt-5-mini': 3,
    'openai/gpt-5-nano': 1,
    'openai/gpt-5-pro': 455,
    'openai/gpt-5.1': 19,
    'openai/gpt-5.1-codex': 19,
    'openai/gpt-5.1-codex-max': 19,
    'openai/gpt-5.2': 29,
    'openai/gpt-5.2-chat': 29,
    'openai/gpt-5.2-codex': 29,
    'openai/gpt-5.2-pro': 702,
    'openai/gpt-5.3-codex': 29,
    'openai/gpt-5.4': 37,
    'openai/gpt-5.4-image-2': 90,
    'openai/gpt-5.4-mini': 8,
    'openai/gpt-5.4-nano': 2,
    'openai/gpt-5.4-pro': 895,
    'openai/gpt-5.5': 90,
    'openai/gpt-5.5-pro': 895,
    'openai/gpt-5.6-luna': 2,
    'openai/gpt-5.6-luna-pro': 2,
    'openai/gpt-5.6-sol': 25,
    'openai/gpt-5.6-sol-pro': 25,
    'openai/gpt-5.6-terra': 28,
    'openai/gpt-5.6-terra-pro': 28,
    'openai/gpt-audio': 29,
    'openai/gpt-audio-mini': 5,
    'openai/gpt-chat-latest': 90,
    'openai/gpt-oss-120b': 1,
    'openai/gpt-oss-20b': 1,
    'openai/o1': 284,
    'openai/o1-pro': 5487,
    'openai/o3': 22,
    'openai/o3-mini': 10,
    'openai/o3-mini-high': 10,
    'openai/o3-pro': 411,
    'openai/o4-mini': 10,
    'openai/o4-mini-high': 10,
    'openrouter/auto': 100,
    'openrouter/auto-beta': 100,
    'openrouter/bodybuilder': 100,
    'openrouter/free': 1,
    'openrouter/fusion': 100,
    'openrouter/pareto-code': 100,
    'perplexity/sonar-deep-research': 22,
    'perplexity/sonar-pro': 41,
    'perplexity/sonar-pro-search': 41,
    'perplexity/sonar-reasoning-pro': 22,
    'qwen/qwen3-235b-a22b-2507': 2,
    'qwen/qwen3-coder': 3,
    'qwen/qwen3-next-80b-a3b-instruct': 2,
    'qwen/qwen3-next-80b-a3b-thinking': 2,
    'qwen/qwen3.5-122b-a10b': 3,
    'qwen/qwen3.5-27b': 3,
    'qwen/qwen3.5-35b-a3b': 3,
    'qwen/qwen3.5-397b-a17b': 6,
    'qwen/qwen3.6-35b-a3b': 2,
    'sakana/fugu-ultra': 90,
    'tencent/hy3': 2,
    'x-ai/grok-4.20': 9,
    'x-ai/grok-4.20-multi-agent': 9,
    'x-ai/grok-4.3': 9,
    'x-ai/grok-4.5': 19,
    'x-ai/grok-4.6': 19,
    'x-ai/grok-build-0.1': 7,
    'xiaomi/mimo-v2.5-pro': 3,
    'z-ai/glm-4.6': 5,
    'z-ai/glm-4.7': 4,
    'z-ai/glm-5': 8,
    'z-ai/glm-5.1': 11,
    'z-ai/glm-5.2': 11,
    'z-ai/glm-5.3': 12,
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
