import { ActivepiecesError, AIProviderName, ErrorCode, isNil, PlatformId, tryCatch } from '@activepieces/core-utils'
import { modelCatalog, ModelTierSurface } from '@activepieces/server-utils'
import { AgentConversation, AgentModelCandidate } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiKeyScope, ProviderScope } from '../../ai/ai-key-scope'
import { aiModelCandidates, FirstCandidate, TierConfigCandidate, TierConfigs } from '../../ai/ai-model-candidates'
import { AIProviderSchema } from '../../ai/ai-provider-entity'
import { platformModelTierService, TierForRun } from '../../ai/platform-model-tier-service'
import { agentModelResolution } from './agent-model-resolution'

export const agentModelTier = (log: FastifyBaseLogger) => ({
    async resolveRun({ platformId, tierId, surface, scope }: { platformId: PlatformId, tierId: string, surface: ModelTierSurface, scope: ProviderScope }): Promise<AgentTierRun> {
        const tiers = await toolCallingTiers({ platformId, tierId, scope })
        const [run, fast] = await Promise.all([
            aiModelCandidates(log).configsFor({ platformId, forRun: tiers.run }),
            isNil(tiers.fast) ? null : aiModelCandidates(log).configsFor({ platformId, forRun: tiers.fast }),
        ])
        if (run.candidates.length === 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `No model in tier "${run.tier.name}" can run` } })
        }
        const consoleBudget = agentModelResolution.resolveTier({ tierId: null, surface }).thinkingBudget
        const candidates = withBudget({ configs: run, consoleBudget })
        const fastIsThisTier = isNil(fast) || fast.candidates.length === 0 || fast.tier.id === run.tier.id
        return {
            tier: { id: run.tier.id, name: run.tier.name },
            candidates,
            fast: fastIsThisTier ? null : withBudget({ configs: fast, consoleBudget })[0],
        }
    },

    async assertUsable({ platformId, tierId, scope }: { platformId: PlatformId, tierId: string, scope: ProviderScope }): Promise<void> {
        await toolCallingTiers({ platformId, tierId, scope })
    },

    async assertProjectSwitchKeepsTier({ platformId, tierId, fromProjectId, toProjectId }: { platformId: PlatformId, tierId: string, fromProjectId: string | null, toProjectId: string | null }): Promise<void> {
        if (fromProjectId === toProjectId) {
            return
        }
        const { run, fast } = await toolCallingTiers({ platformId, tierId, scope: isNil(fromProjectId) ? { type: 'platform' } : { type: 'project', projectId: fromProjectId } })
        const keys = [...run.entries, ...(fast?.entries ?? [])].map((entry) => entry.key)
        const servesTarget = (key: AIProviderSchema): boolean => isNil(toProjectId)
            ? key.projectScope === 'all'
            : aiKeyScope.rowAllowsScope({ row: key, scope: { type: 'project', projectId: toProjectId } })
        if (keys.every(servesTarget)) {
            return
        }
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'a model this run can use is not available to the project it tried to switch to' },
        })
    },

    async mainModelOf({ conversation }: { conversation: Pick<AgentConversation, 'platformId' | 'modelTierId'> }): Promise<FirstCandidate | null> {
        const tierId = conversation.modelTierId
        if (isNil(tierId)) {
            return null
        }
        const { data } = await tryCatch(() => aiModelCandidates(log).firstCandidates({ platformId: conversation.platformId, tierIds: [tierId] }))
        return data?.get(tierId) ?? null
    },

    async mainModelsOf({ conversations }: { conversations: Pick<AgentConversation, 'platformId' | 'modelTierId'>[] }): Promise<Map<string, FirstCandidate | null>> {
        const tierIdsByPlatform = new Map<string, string[]>()
        conversations.forEach(({ platformId, modelTierId }) => {
            if (!isNil(modelTierId)) {
                tierIdsByPlatform.set(platformId, [...(tierIdsByPlatform.get(platformId) ?? []), modelTierId])
            }
        })
        const perPlatform = await Promise.all([...tierIdsByPlatform].map(async ([platformId, tierIds]): Promise<[string, FirstCandidate | null][]> => {
            const { data, error } = await tryCatch(() => aiModelCandidates(log).firstCandidates({ platformId, tierIds }))
            if (!isNil(error) || isNil(data)) {
                log.warn({ error, platform: { id: platformId }, tierCount: tierIds.length }, '[agentModelTier] Could not resolve the tiers of a platform in one pass, each conversation will look its tier up on its own')
                return []
            }
            return tierIds.map((tierId) => [tierCacheKey({ platformId, tierId }), data.get(tierId) ?? null])
        }))
        return new Map(perPlatform.flat())
    },
})

async function toolCallingTiers({ platformId, tierId, scope }: { platformId: PlatformId, tierId: string, scope: ProviderScope }): Promise<{ run: TierForRun, fast: TierForRun | null }> {
    const [run, fast, callsTools] = await Promise.all([
        platformModelTierService.getForRun({ platformId, id: tierId, scope }),
        platformModelTierService.getFastForRun({ platformId, scope }),
        toolCallingCheck(),
    ])
    const toolRun = withToolCallingEntries({ forRun: run, callsTools })
    if (isNil(toolRun)) {
        throw noToolCallingError({ tierName: run.tier.name })
    }
    return { run: toolRun, fast: isNil(fast) ? null : withToolCallingEntries({ forRun: fast, callsTools }) }
}

async function toolCallingCheck(): Promise<CallsTools> {
    const catalog = await modelCatalog.load()
    return ({ provider, modelId }) => catalog.lookup({ provider, modelId })?.supportsToolCalling !== false
}

function withToolCallingEntries({ forRun, callsTools }: { forRun: TierForRun, callsTools: CallsTools }): TierForRun | null {
    const main = forRun.tier.entries[0]
    const mainEntry = forRun.entries.find((entry) => entry.key.id === main.configId && entry.modelId === main.modelId)
    const entries = forRun.entries.filter((entry) => callsTools({ provider: entry.key.provider, modelId: entry.modelId }))
    const mainRefused = !isNil(mainEntry) && !entries.includes(mainEntry)
    return mainRefused || entries.length === 0 ? null : { tier: forRun.tier, entries }
}

function noToolCallingError({ tierName }: { tierName: string }): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `The main model of tier "${tierName}" can't call tools, so agents and chat can't use it` } })
}

function tierCacheKey({ platformId, tierId }: { platformId: string, tierId: string }): string {
    return `${platformId}:${tierId}`
}

function withBudget({ configs, consoleBudget }: { configs: TierConfigs, consoleBudget: number }): AgentTierCandidate[] {
    const thinkingBudget = configs.tier.thinkingBudget ?? consoleBudget
    return configs.candidates.map((candidate) => ({ ...candidate, thinkingBudget }))
}

function toWorkerCandidate({ config, modelId, status, thinkingBudget }: AgentTierCandidate): AgentModelCandidate {
    return { ...config, providerConfigId: config.configId, modelId, status, thinkingBudget }
}

export const agentTierCandidates = { toWorkerCandidate, tierCacheKey }

export type AgentTierCandidate = TierConfigCandidate & {
    thinkingBudget: number
}

type CallsTools = (model: { provider: AIProviderName, modelId: string }) => boolean

export type AgentTierRun = {
    tier: { id: string, name: string }
    candidates: AgentTierCandidate[]
    fast: AgentTierCandidate | null
}
