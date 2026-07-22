import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, unique } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, ChatConversationStatus, DEFAULT_CHAT_TIER_ID, GetChatMemoryResponse, GetProviderConfigResponse, Project, ProjectType, UserChatMemory } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { redisConnections } from '../../database/redis-connections'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { ChatConversationEntity } from './chat-conversation-entity'
import { UserChatMemoryEntity } from './user-chat-memory-entity'

const STREAMING_STALENESS_TIMEOUT_MS = 90 * 1_000
const FAST_TIER_ID = 'fast'

// Interactive-eval conversations carry this id prefix (within the 21-char id column) so both the
// eval endpoints and the regular chat path can tell them apart from real user conversations.
export const EVAL_CONVERSATION_ID_PREFIX = 'evalconv'

export function isEvalConversationId(id: string): boolean {
    return id.startsWith(EVAL_CONVERSATION_ID_PREFIX)
}

const conversationRepo = repoFactory(ChatConversationEntity)
const userChatMemoryRepo = repoFactory(UserChatMemoryEntity)

const MAX_MEMORIES = 50
const MAX_MEMORY_LENGTH = 280
const MAX_INSTRUCTIONS_LENGTH = 4000

async function getConversationOrThrow({ id, platformId, userId, log }: { id: string, platformId: string, userId: string, log?: FastifyBaseLogger }) {
    const conversation = await conversationRepo().findOneBy({ id, platformId, userId })
    if (isNil(conversation)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: id, entityType: 'ChatConversation' },
        })
    }
    if (conversation.status === ChatConversationStatus.STREAMING) {
        const msSinceUpdate = Date.now() - new Date(conversation.updated).getTime()
        if (msSinceUpdate > STREAMING_STALENESS_TIMEOUT_MS) {
            await conversationRepo().update(id, { status: ChatConversationStatus.IDLE })
            conversation.status = ChatConversationStatus.IDLE
            log?.warn({ conversation: { id }, stuckForMs: msSinceUpdate }, '[chatHelpers] Recovered stale STREAMING conversation to IDLE')
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

function resolveTier({ tierId }: { tierId: string | null }) {
    if (tierId) {
        const tier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
        if (tier) return tier
    }
    const defaultTier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === DEFAULT_CHAT_TIER_ID)
    return defaultTier ?? ACTIVEPIECES_CHAT_TIERS[0]
}

function resolveModelIdForProvider({ tier, provider }: { tier: { modelId: string }, provider: AIProviderName }): string {
    const openrouterModelId = tier.modelId
    if (provider === AIProviderName.ACTIVEPIECES || provider === AIProviderName.OPENROUTER) {
        return openrouterModelId
    }
    return openrouterModelId.replace(/^[^/]+\//, '').replace(/\./g, '-')
}

// Round one of the chat turn runs on the fastest tier so its first token streams in ~400ms
// (the opener + first discovery) — fast enough to replace the bare "Thinking…" gap —
// regardless of which tier the user picked for the main turn.
function resolveFastModelId({ provider }: { provider: AIProviderName }): string {
    return resolveModelIdForProvider({ tier: resolveTier({ tierId: FAST_TIER_ID }), provider })
}

async function recoverAllStaleStreamingConversations({ log }: { log: FastifyBaseLogger }): Promise<{ recovered: number }> {
    // Compare against the DB clock (NOW()) rather than a bound JS Date, so the sweep is immune
    // to app/DB clock skew and driver timezone handling.
    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({ status: ChatConversationStatus.IDLE })
        .where('status = :streaming', { streaming: ChatConversationStatus.STREAMING })
        .andWhere('updated < NOW() - make_interval(secs => :staleSecs)', { staleSecs: STREAMING_STALENESS_TIMEOUT_MS / 1_000 })
        .andWhere('id NOT LIKE :evalPrefix', { evalPrefix: `${EVAL_CONVERSATION_ID_PREFIX}%` })
        .execute()
    const recovered = result.affected ?? 0
    if (recovered > 0) {
        log.warn({ recovered }, '[chatHelpers] Swept stale STREAMING conversations to IDLE')
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

async function getUserChatMemory({ platformId, userId }: { platformId: string, userId: string }): Promise<GetChatMemoryResponse> {
    const row = await userChatMemoryRepo().findOneBy({ platformId, userId })
    return { instructions: row?.instructions ?? null, memories: row?.memories ?? [] }
}

function capMemories({ instructions, memories }: { instructions: string | null, memories: string[] }): GetChatMemoryResponse {
    const trimmedInstructions = instructions?.trim()
    return {
        instructions: trimmedInstructions ? trimmedInstructions.slice(0, MAX_INSTRUCTIONS_LENGTH) : null,
        memories: memories
            .map((memory) => memory.trim().slice(0, MAX_MEMORY_LENGTH))
            .filter((memory) => memory.length > 0)
            .slice(0, MAX_MEMORIES),
    }
}

async function withLockedMemoryRow<T>({ platformId, userId }: { platformId: string, userId: string }, cb: (args: { repo: ReturnType<typeof userChatMemoryRepo>, row: UserChatMemory | null }) => Promise<T>): Promise<T> {
    return transaction(async (entityManager) => {
        const repo = entityManager.getRepository(UserChatMemoryEntity)
        await repo.createQueryBuilder()
            .insert()
            .values({ id: apId(), platformId, userId, memories: [] })
            .orIgnore()
            .execute()
        const row = await repo.findOne({ where: { platformId, userId }, lock: { mode: 'pessimistic_write' } })
        return cb({ repo, row })
    })
}

async function saveUserChatMemory({ platformId, userId, instructions, memories, baseMemories }: {
    platformId: string
    userId: string
    instructions?: string | null
    memories?: string[]
    baseMemories?: string[]
}): Promise<GetChatMemoryResponse> {
    return withLockedMemoryRow({ platformId, userId }, async ({ repo, row }) => {
        const lockedMemories = row?.memories ?? []
        const nextMemories = memories === undefined
            ? lockedMemories
            : isNil(baseMemories)
                ? memories
                : unique([...memories, ...lockedMemories.filter((m) => !baseMemories.includes(m))])
        const capped = capMemories({
            instructions: instructions === undefined ? row?.instructions ?? null : instructions,
            memories: nextMemories,
        })
        await repo.update({ platformId, userId }, capped)
        return capped
    })
}

export const chatHelpers = {
    getConversationOrThrow,
    getUserProjects,
    resolveChatProvider,
    resolveTier,
    resolveModelIdForProvider,
    resolveFastModelId,
    recoverAllStaleStreamingConversations,
    incrementAndCheckLimit,
    conversationRepo,
    getUserChatMemory,
    capMemories,
    saveUserChatMemory,
}
