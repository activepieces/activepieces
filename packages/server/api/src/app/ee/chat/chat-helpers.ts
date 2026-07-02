import { ActivepiecesError, AIProviderName, ErrorCode, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, CHAT_INTERRUPTED_MESSAGE, ChatConversation, ChatConversationStatus, DEFAULT_CHAT_TIER_ID, GetProviderConfigResponse, PersistedChatMessage, PersistedChatPartType, PersistedChatRole, Project, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { repoFactory } from '../../core/db/repo-factory'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { chatApprovalGate } from './chat-approval-gate'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatResume } from './chat-resume'

const STREAMING_STALENESS_TIMEOUT_MS = 90 * 1_000
const FAST_TIER_ID = 'fast'

// Interactive-eval conversations carry this id prefix (within the 21-char id column) so both the
// eval endpoints and the regular chat path can tell them apart from real user conversations.
export const EVAL_CONVERSATION_ID_PREFIX = 'evalconv'

export function isEvalConversationId(id: string): boolean {
    return id.startsWith(EVAL_CONVERSATION_ID_PREFIX)
}

const conversationRepo = repoFactory(ChatConversationEntity)

async function getConversationOrThrow({ id, platformId, userId, log }: { id: string, platformId: string, userId: string, log: FastifyBaseLogger }) {
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
            await recoverStaleStreamingConversation({ conversation, stuckForMs: msSinceUpdate, log })
            // Recovery either enqueued a crash resume (status now IDLE, a resume job in flight) or,
            // once the budget is spent, flipped to ERROR. Reflect the persisted status so the caller
            // and UI don't see a phantom STREAMING; re-read since recovery may have left either.
            const recovered = await conversationRepo().findOneBy({ id })
            if (!isNil(recovered)) {
                conversation.status = recovered.status
                conversation.uiMessages = recovered.uiMessages
            }
        }
    }
    return conversation
}

// A STREAMING conversation whose heartbeat went silent past the staleness window has lost its
// worker (deploy/crash/tsx reload dropped the job) — nothing else will ever finish it. First try to
// auto-resume: if this user turn still has resume budget, enqueue a crash resume (with a
// verify-before-redo note) and leave the interrupted note off entirely, so recovery is invisible.
// Only when the budget is spent do we flip to ERROR and append a persisted assistant message so
// history alone renders an explanation + retry, instead of an eternal thinking shimmer. Fenced on
// status so a live turn that just resumed can't be clobbered. Returns true when recovery actually
// happened (a crash resume was enqueued or the row flipped to ERROR), false when another writer won
// the status race.
async function recoverStaleStreamingConversation({ conversation, stuckForMs, log }: { conversation: ChatConversation, stuckForMs: number, log: FastifyBaseLogger }): Promise<boolean> {
    const resumed = await chatResume.tryEnqueueCrashResume({ conversation, log }).catch(() => false)
    if (resumed) {
        return true
    }
    const previousUiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
    const alreadyNoted = previousUiMessages.some((message) => message.role === PersistedChatRole.ASSISTANT
        && message.parts.some((part) => part.type === PersistedChatPartType.TEXT && part.text === CHAT_INTERRUPTED_MESSAGE))
    const uiMessages: PersistedChatMessage[] = alreadyNoted
        ? previousUiMessages
        : [...previousUiMessages, { role: PersistedChatRole.ASSISTANT, parts: [{ type: PersistedChatPartType.TEXT, text: CHAT_INTERRUPTED_MESSAGE }] }]
    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({ status: ChatConversationStatus.ERROR, uiMessages: () => ':uiMessages', activeRunId: null })
        .setParameter('uiMessages', JSON.stringify(sanitizeObjectForPostgresql(uiMessages)))
        .where('id = :id AND status = :streaming', { id: conversation.id, streaming: ChatConversationStatus.STREAMING })
        .execute()
    if ((result.affected ?? 0) === 0) {
        return false
    }
    conversation.uiMessages = uiMessages
    await chatApprovalGate.clearPendingGate({ conversationId: conversation.id })
    log.warn({ conversation: { id: conversation.id }, stuckForMs }, '[chatHelpers] Recovered stale STREAMING conversation to ERROR with interrupted-message')
    return true
}

// Active sweep for the watchdog system job: recover every STREAMING conversation whose heartbeat is
// older than the staleness window, even when no one is polling the conversation. Complements the
// lazy per-read recovery in getConversationOrThrow so a dead turn can never linger.
async function recoverAllStaleStreamingConversations({ log }: { log: FastifyBaseLogger }): Promise<{ recovered: number }> {
    const staleCutoff = new Date(Date.now() - STREAMING_STALENESS_TIMEOUT_MS)
    const stale = await conversationRepo()
        .createQueryBuilder('chat_conversation')
        .where('chat_conversation.status = :streaming', { streaming: ChatConversationStatus.STREAMING })
        .andWhere('chat_conversation.updated < :staleCutoff', { staleCutoff })
        .getMany()
    let recovered = 0
    for (const conversation of stale) {
        const stuckForMs = Date.now() - new Date(conversation.updated).getTime()
        const { data: didRecover, error } = await tryCatch(() => recoverStaleStreamingConversation({ conversation, stuckForMs, log }))
        if (!isNil(error)) {
            log.error({ error, conversation: { id: conversation.id } }, '[chatHelpers] Failed to recover stale STREAMING conversation')
            continue
        }
        if (didRecover) {
            recovered++
        }
    }
    if (recovered > 0) {
        log.info({ recoveredCount: recovered }, '[chatHelpers] Sweeper recovered stale STREAMING conversations')
    }
    return { recovered }
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

export const chatHelpers = {
    getConversationOrThrow,
    recoverAllStaleStreamingConversations,
    getUserProjects,
    resolveChatProvider,
    resolveTier,
    resolveModelIdForProvider,
    resolveFastModelId,
    conversationRepo,
}
