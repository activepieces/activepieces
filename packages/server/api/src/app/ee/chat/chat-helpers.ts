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
// Cap per-sweep work so a backlog of stuck rows can't blow up memory in one cron tick; the
// remainder is picked up next minute (oldest-first), and lazy per-read recovery covers the rest.
const STALE_SWEEP_BATCH_SIZE = 100
const FAST_TIER_ID = 'fast'

// Interactive-eval conversations carry this id prefix (within the 21-char id column) so both the
// eval endpoints and the regular chat path can tell them apart from real user conversations.
export const EVAL_CONVERSATION_ID_PREFIX = 'evalconv'

export function isEvalConversationId(id: string): boolean {
    return id.startsWith(EVAL_CONVERSATION_ID_PREFIX)
}

const conversationRepo = repoFactory(ChatConversationEntity)

// skipStaleRecovery: fetch without the lazy stale-STREAMING recovery side effect. The gate-answer
// path needs this — resumeParkedGate must own the resume for an answered gate, so we must not let a
// read fire a competing crash resume (which would inject a spurious crash note into LLM history and
// orphan the crash-resume job when resumeParkedGate later reclaims activeRunId). The answer wins.
async function getConversationOrThrow({ id, platformId, userId, log, skipStaleRecovery = false }: { id: string, platformId: string, userId: string, log: FastifyBaseLogger, skipStaleRecovery?: boolean }) {
    const conversation = await conversationRepo().findOneBy({ id, platformId, userId })
    if (isNil(conversation)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: id, entityType: 'ChatConversation' },
        })
    }
    if (!skipStaleRecovery && conversation.status === ChatConversationStatus.STREAMING) {
        const msSinceUpdate = Date.now() - new Date(conversation.updated).getTime()
        if (msSinceUpdate > STREAMING_STALENESS_TIMEOUT_MS) {
            await recoverStaleStreamingConversation({ conversation, stuckForMs: msSinceUpdate, log })
            // Recovery may have parked the turn (IDLE, card kept), enqueued a crash resume (IDLE,
            // fresh activeRunId, note appended to messages), or flipped to ERROR. Refresh every field
            // recovery can touch — status, activeRunId, messages, uiMessages — so the returned row is
            // the authoritative post-recovery snapshot and callers fencing on activeRunId (Fix 5)
            // don't act on a stale pre-recovery value.
            const recovered = await conversationRepo().findOneBy({ id })
            if (!isNil(recovered)) {
                conversation.status = recovered.status
                conversation.activeRunId = recovered.activeRunId
                conversation.messages = recovered.messages
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
    // 'parked' (dead worker on an open gate) and 'resumed' (gateless crash resume enqueued) are both
    // successful recoveries — the row is no longer a phantom STREAMING. Only 'exhausted' (budget spent
    // or lost the status race) falls through to the ERROR + interrupted-message path below.
    const { data: outcome, error } = await tryCatch(() => chatResume.tryEnqueueCrashResume({ conversation, log }))
    if (!isNil(error)) {
        log.error({ error, conversation: { id: conversation.id } }, '[chatHelpers] Crash-resume attempt threw — falling back to ERROR path')
    }
    if (outcome === 'parked' || outcome === 'resumed') {
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
        // Only the columns recovery touches — skip the big summary text and the title/created/
        // summarizedUpToIndex columns the crash-resume/park path never reads.
        .select([
            'chat_conversation.id',
            'chat_conversation.platformId',
            'chat_conversation.projectId',
            'chat_conversation.userId',
            'chat_conversation.modelName',
            'chat_conversation.status',
            'chat_conversation.activeRunId',
            'chat_conversation.messages',
            'chat_conversation.uiMessages',
            'chat_conversation.updated',
        ])
        .where('chat_conversation.status = :streaming', { streaming: ChatConversationStatus.STREAMING })
        .andWhere('chat_conversation.updated < :staleCutoff', { staleCutoff })
        // Never resume eval/dry-run conversations (Fix 3): a resume enqueues a REAL turn (no
        // dryRun/discoveryOnly), so a dead eval run would fire real tools/credits/side effects. Eval
        // callers poll the row directly and own their own timeout, so they need no recovery. Both eval
        // paths (interactive turn/start AND simulate) carry the eval id prefix, so this one filter skips
        // them all — the sweeper is the only recovery path that could reach an eval row.
        .andWhere('chat_conversation.id NOT LIKE :evalPrefix', { evalPrefix: `${EVAL_CONVERSATION_ID_PREFIX}%` })
        .orderBy('chat_conversation.updated', 'ASC')
        .take(STALE_SWEEP_BATCH_SIZE)
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
