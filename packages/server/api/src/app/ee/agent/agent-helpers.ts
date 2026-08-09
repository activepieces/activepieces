import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, tryCatch, unique } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { ACTIVEPIECES_CHAT_TIERS, AgentConversationStatus, aiProviderUtils, DEFAULT_CHAT_TIER_ID, GetAgentMemoryResponse, GetProviderConfigResponse, Project, ProjectType, UserMemory } from '@activepieces/shared'
import { LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { redisConnections } from '../../database/redis-connections'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { AgentConversationEntity } from './agent-conversation-entity'
import { UserMemoryEntity } from './user-memory-entity'

const STREAMING_STALENESS_TIMEOUT_MS = 90 * 1_000
const FAST_TIER_ID = 'fast'

// Interactive-eval conversations carry this id prefix (within the 21-char id column) so both the
// eval endpoints and the regular chat path can tell them apart from real user conversations.
export const EVAL_CONVERSATION_ID_PREFIX = 'evalconv'

export function isEvalConversationId(id: string): boolean {
    return id.startsWith(EVAL_CONVERSATION_ID_PREFIX)
}

const conversationRepo = repoFactory(AgentConversationEntity)
const userMemoryRepo = repoFactory(UserMemoryEntity)

const MAX_MEMORIES = 50
const MAX_MEMORY_LENGTH = 280
const MAX_INSTRUCTIONS_LENGTH = 4000

async function getConversationOrThrow({ id, platformId, userId, log }: { id: string, platformId: string, userId: string, log?: FastifyBaseLogger }) {
    const conversation = await conversationRepo().findOneBy({ id, platformId, userId })
    if (isNil(conversation)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: id, entityType: 'AgentConversation' },
        })
    }
    if (conversation.status === AgentConversationStatus.STREAMING) {
        const msSinceUpdate = Date.now() - new Date(conversation.updated).getTime()
        if (msSinceUpdate > STREAMING_STALENESS_TIMEOUT_MS) {
            await conversationRepo().update(id, { status: AgentConversationStatus.IDLE })
            conversation.status = AgentConversationStatus.IDLE
            log?.warn({ conversation: { id }, stuckForMs: msSinceUpdate }, '[agentHelpers] Recovered stale STREAMING conversation to IDLE')
        }
    }
    return conversation
}

async function getUserProjects({ platformId, userId, log }: { platformId: string, userId: string, log: FastifyBaseLogger }): Promise<Project[]> {
    const users = userService(log)
    const user = await users.getOneOrFail({ id: userId })
    const allProjects = await projectService(log).getAllForUser({
        platformId,
        userId,
        isPrivileged: users.isUserPrivileged(user),
    })
    return allProjects.filter((p) => p.type !== ProjectType.PERSONAL || p.ownerId === userId)
}

async function resolveChatProvider({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<GetProviderConfigResponse> {
    const chatProvider = await aiProviderService(log).getChatProvider({ platformId })
    if (isNil(chatProvider)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: platformId, entityType: 'ChatAiProvider' },
        })
    }
    return chatProvider
}

function findTier({ tierId }: { tierId: string | null }) {
    return ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
}

function resolveTier({ tierId }: { tierId: string | null }) {
    return findTier({ tierId }) ?? findTier({ tierId: DEFAULT_CHAT_TIER_ID }) ?? ACTIVEPIECES_CHAT_TIERS[0]
}

function resolveModelIdForProvider({ provider, selectedModel }: { provider: AIProviderName, selectedModel: string | null }): string {
    const curatedModels = aiProviderUtils.getCuratedChatModels({ provider })
    if (selectedModel && curatedModels?.some((model) => model.id === selectedModel)) {
        return selectedModel
    }
    const tierModelId = resolveTier({ tierId: selectedModel }).modelId
    if (provider === AIProviderName.ACTIVEPIECES || provider === AIProviderName.OPENROUTER) {
        return tierModelId
    }
    const nativeModelId = tierModelId.replace(/^[^/]+\//, '').replace(/\./g, '-')
    if (isNil(curatedModels)) {
        return nativeModelId
    }
    return curatedModels.some((model) => model.id === nativeModelId) ? nativeModelId : curatedModels[0].id
}

// Analytics and billing report the model a turn ran on. The provider is unknown when a platform's
// chat provider no longer resolves, so fall back to the stored selection — but only when it is one
// of our own ids, never echoing an arbitrary stored string out to the analytics sink.
function resolveModelIdForAnalytics({ provider, selectedModel }: { provider: AIProviderName | null, selectedModel: string | null }): string | null {
    if (isNil(selectedModel)) {
        return null
    }
    if (!isNil(provider)) {
        return resolveModelIdForProvider({ provider, selectedModel })
    }
    const tier = findTier({ tierId: selectedModel })
    if (!isNil(tier)) {
        return tier.modelId
    }
    return aiProviderUtils.isCuratedChatModelId({ modelId: selectedModel }) ? selectedModel : null
}

// Round one of the chat turn runs on the fastest tier so its first token streams in ~400ms
// (the opener + first discovery) — fast enough to replace the bare "Thinking…" gap —
// regardless of which tier the user picked for the main turn.
async function resolveFastModel({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<LanguageModel> {
    const providerConfig = await resolveChatProvider({ platformId, log })
    return agentAiUtils.createChatModel({
        provider: providerConfig.provider,
        auth: providerConfig.auth,
        config: providerConfig.config,
        modelId: resolveFastModelId({ provider: providerConfig.provider }),
    })
}

function resolveFastModelId({ provider }: { provider: AIProviderName }): string {
    return resolveModelIdForProvider({ provider, selectedModel: FAST_TIER_ID })
}

async function resolveChatProviderName({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<AIProviderName | null> {
    const result = await tryCatch(() => aiProviderService(log).getChatProviderName({ platformId }))
    return result.error ? null : result.data
}

async function recoverAllStaleStreamingConversations({ log }: { log: FastifyBaseLogger }): Promise<{ recovered: number }> {
    // Compare against the DB clock (NOW()) rather than a bound JS Date, so the sweep is immune
    // to app/DB clock skew and driver timezone handling.
    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({ status: AgentConversationStatus.IDLE })
        .where('status = :streaming', { streaming: AgentConversationStatus.STREAMING })
        .andWhere('updated < NOW() - make_interval(secs => :staleSecs)', { staleSecs: STREAMING_STALENESS_TIMEOUT_MS / 1_000 })
        .andWhere('id NOT LIKE :evalPrefix', { evalPrefix: `${EVAL_CONVERSATION_ID_PREFIX}%` })
        .execute()
    const recovered = result.affected ?? 0
    if (recovered > 0) {
        log.warn({ recovered }, '[agentHelpers] Swept stale STREAMING conversations to IDLE')
    }
    return { recovered }
}

async function incrementAndCheckLimit({ key, limit, ttlSeconds }: { key: string, limit: number, ttlSeconds: number }): Promise<{ allowed: boolean, count: number }> {
    const redis = await redisConnections.useExisting()
    // INCR + EXPIRE in one atomic script: a crash between the two would otherwise leave a key with
    // no TTL, permanently blocking the user. EXPIRE only on first increment keeps a fixed window.
    const count = await redis.eval(
        `local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`,
        1,
        key,
        ttlSeconds.toString(),
    ) as number
    return { allowed: count <= limit, count }
}

async function getUserMemory({ platformId, userId }: { platformId: string, userId: string }): Promise<GetAgentMemoryResponse> {
    const row = await userMemoryRepo().findOneBy({ platformId, userId })
    return { instructions: row?.instructions ?? null, memories: row?.memories ?? [] }
}

function capMemories({ instructions, memories }: { instructions: string | null, memories: string[] }): GetAgentMemoryResponse {
    const trimmedInstructions = instructions?.trim()
    return {
        instructions: trimmedInstructions ? trimmedInstructions.slice(0, MAX_INSTRUCTIONS_LENGTH) : null,
        memories: unique(memories
            .map((memory) => memory.trim().slice(0, MAX_MEMORY_LENGTH))
            .filter((memory) => memory.length > 0))
            .slice(0, MAX_MEMORIES),
    }
}

async function withLockedMemoryRow<T>({ platformId, userId }: { platformId: string, userId: string }, cb: (args: { repo: ReturnType<typeof userMemoryRepo>, row: UserMemory | null }) => Promise<T>): Promise<T> {
    return transaction(async (entityManager) => {
        const repo = entityManager.getRepository(UserMemoryEntity)
        await repo.createQueryBuilder()
            .insert()
            .values({ id: apId(), platformId, userId, memories: [] })
            .orIgnore()
            .execute()
        const row = await repo.findOne({ where: { platformId, userId }, lock: { mode: 'pessimistic_write' } })
        return cb({ repo, row })
    })
}

function mergeMemories({ base, incoming, current }: { base: string[], incoming: string[], current: string[] }): string[] {
    return unique([
        ...incoming.filter((memory) => !base.includes(memory) || current.includes(memory)),
        ...current.filter((memory) => !base.includes(memory)),
    ])
}

async function saveUserMemory({ platformId, userId, instructions, memories, baseMemories }: {
    platformId: string
    userId: string
    instructions?: string | null
    memories?: string[]
    baseMemories?: string[]
}): Promise<GetAgentMemoryResponse> {
    return withLockedMemoryRow({ platformId, userId }, async ({ repo, row }) => {
        const lockedMemories = row?.memories ?? []
        const nextMemories = memories === undefined
            ? lockedMemories
            : isNil(baseMemories)
                ? memories
                : mergeMemories({ base: baseMemories, incoming: memories, current: lockedMemories })
        const capped = capMemories({
            instructions: instructions === undefined ? row?.instructions ?? null : instructions,
            memories: nextMemories,
        })
        await repo.update({ platformId, userId }, capped)
        return capped
    })
}

export const agentHelpers = {
    getConversationOrThrow,
    getUserProjects,
    resolveChatProvider,
    resolveTier,
    resolveModelIdForProvider,
    resolveModelIdForAnalytics,
    resolveFastModelId,
    resolveFastModel,
    resolveChatProviderName,
    recoverAllStaleStreamingConversations,
    incrementAndCheckLimit,
    conversationRepo,
    getUserMemory,
    capMemories,
    mergeMemories,
    saveUserMemory,
}
