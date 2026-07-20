import { ActivepiecesError, AIProviderName, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, ChatConversationStatus, DEFAULT_CHAT_TIER_ID, GetProviderConfigResponse, Project, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { ChatConversationEntity } from './chat-conversation-entity'

const STREAMING_STALENESS_TIMEOUT_MS = 90 * 1_000
const FAST_TIER_ID = 'fast'

// Interactive-eval conversations carry this id prefix (within the 21-char id column) so both the
// eval endpoints and the regular chat path can tell them apart from real user conversations.
export const EVAL_CONVERSATION_ID_PREFIX = 'evalconv'

export function isEvalConversationId(id: string): boolean {
    return id.startsWith(EVAL_CONVERSATION_ID_PREFIX)
}

const conversationRepo = repoFactory(ChatConversationEntity)

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

function resolveModelId({ tierId, provider }: { tierId: string | null, provider: AIProviderName | null }): string | null {
    if (isNil(tierId)) {
        return null
    }
    const tier = ACTIVEPIECES_CHAT_TIERS.find((t) => t.id === tierId)
    if (isNil(tier)) {
        return tierId
    }
    if (isNil(provider)) {
        return tier.modelId
    }
    return resolveModelIdForProvider({ tier, provider })
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

export const chatHelpers = {
    getConversationOrThrow,
    getUserProjects,
    resolveChatProvider,
    resolveTier,
    resolveModelIdForProvider,
    resolveFastModelId,
    resolveModelId,
    resolveChatProviderName,
    recoverAllStaleStreamingConversations,
    incrementAndCheckLimit,
    conversationRepo,
}
