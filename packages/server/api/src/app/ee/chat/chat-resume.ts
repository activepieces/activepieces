import { apId, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { CHAT_CRASH_RESUME_NOTE, CHAT_LATE_APPROVAL_MARKER, CHAT_MAX_AUTO_RESUMES, ChatConversation, ChatConversationStatus, chatToolClassification, PersistedChatMessage, PersistedChatPartType, PersistedToolCallPart, PersistedToolCallStatus } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { chatApprovalGate } from './chat-approval-gate'
import { ChatConversationEntity } from './chat-conversation-entity'
import { chatGateUtils } from './chat-gate-utils'
import { chatJob } from './chat-job'

// Local repo factory (not chatHelpers.conversationRepo) to break the chat-resume ↔ chat-helpers
// import cycle: chat-helpers imports chatResume, so chatResume must not import chatHelpers back.
const conversationRepo = repoFactory(ChatConversationEntity)

// Enqueues one resume turn — a normal EXECUTE_CHAT_AGENT job with no user message. getChatConfig
// keys off resumeKind to rebuild the LLM history from what we just persisted (an answered gate's
// tool result, or a crash-resume note) instead of appending a user bubble. A fresh runId is claimed
// as the conversation's active run BEFORE enqueue so the worker (which fences on activeRunId in
// getChatConfig) can never pick the job up before it owns the conversation and self-reject.
//
// Because the claim lands first, a failing jobQueue.add would otherwise leave the row pointing at a
// runId with no live job — an IDLE conversation the sweep ignores and no user action can unstick. So
// on enqueue failure we roll the claim back to what it was (typically null) and rethrow.
async function enqueueResumeTurn({ conversation, resumeKind, log }: {
    conversation: ChatConversation
    resumeKind: 'gate' | 'crash'
    log: FastifyBaseLogger
}): Promise<void> {
    const runId = apId()
    const previousActiveRunId = conversation.activeRunId ?? null
    await conversationRepo().update(conversation.id, { activeRunId: runId })
    const { error } = await tryCatch(() => chatJob.enqueueChatAgentJob({
        conversationId: conversation.id,
        runId,
        projectId: conversation.projectId ?? null,
        platformId: conversation.platformId,
        userId: conversation.userId,
        userMessage: '',
        modelName: conversation.modelName ?? null,
        resumeKind,
        log,
    }))
    if (!isNil(error)) {
        await tryCatch(() => conversationRepo().update(conversation.id, { activeRunId: previousActiveRunId }))
        log.error({ error, conversation: { id: conversation.id }, run: { id: runId }, resumeKind }, '[chatResume] Failed to enqueue resume turn — rolled back activeRunId')
        throw error
    }
    log.info({ conversation: { id: conversation.id }, run: { id: runId }, resumeKind }, '[chatResume] Enqueued resume turn')
}

// A user answered a gate whose turn is gone (parked/dead). Persist the answer as the tool result of
// the still-PENDING gate tool-call — both in the LLM history and in uiMessages (flip the card PENDING
// → completed) — then enqueue a resume turn. Idempotent via the fenced card-flip: if the gate part is
// already resolved (a live worker beat us, or a double-tap), the UPDATE matches zero rows and this
// returns false so the caller skips the resume.
//
// Gate kind matters (Fix 1). Answer-gates (questions, pickers, quick replies) carry the answer AS the
// result — the payload is the outcome. Approval-gates (ap_execute_action / ap_send_email /
// ap_test_flow) execute a real side effect AFTER approval, and that code died with the parked worker.
// For a late-APPROVED approval-gate we (a) persist a non-execution marker so the resumed model knows
// the action was NOT run and must be re-issued, and (b) store a one-shot pre-approval so the re-issued
// call runs without opening a second card. A late-DENIED gate needs no execution — the declined result
// is fine either way.
async function resumeParkedGate({ conversation, gateId, approved, payload, log }: {
    conversation: ChatConversation
    gateId: string
    approved: boolean
    payload?: Record<string, unknown>
    log: FastifyBaseLogger
}): Promise<boolean> {
    const uiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
    const pendingPart = chatGateUtils.findPendingGatePart({ uiMessages, gateId })
    if (isNil(pendingPart)) {
        return false
    }

    const isLateApprovedApprovalGate = approved && chatToolClassification.isApprovalGate(pendingPart.toolName)
    const output = isLateApprovedApprovalGate
        ? { ...CHAT_LATE_APPROVAL_MARKER }
        : { ...(payload ?? {}), approved }

    const messages = conversation.messages as ModelMessage[]
    const messagesWithAnswer: ModelMessage[] = [
        ...messages,
        { role: 'assistant', content: [{ type: 'tool-call', toolCallId: gateId, toolName: pendingPart.toolName, input: pendingPart.input }] },
        { role: 'tool', content: [{ type: 'tool-result', toolCallId: gateId, toolName: pendingPart.toolName, output: { type: 'json', value: output } }] },
    ]

    const resolvedUiMessages = uiMessages.map((message) => ({
        ...message,
        parts: message.parts.map((part) => part.type === PersistedChatPartType.TOOL_CALL
            && part.toolCallId === gateId
            && part.status === PersistedToolCallStatus.PENDING
            ? { ...part, status: PersistedToolCallStatus.COMPLETED, output }
            : part),
    }))

    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({
            messages: () => ':messages',
            uiMessages: () => ':uiMessages',
            status: ChatConversationStatus.IDLE,
        })
        .setParameter('messages', JSON.stringify(sanitizeObjectForPostgresql(messagesWithAnswer)))
        .setParameter('uiMessages', JSON.stringify(sanitizeObjectForPostgresql(resolvedUiMessages)))
        .where('id = :id AND status != :streaming', { id: conversation.id, streaming: ChatConversationStatus.STREAMING })
        .execute()
    if ((result.affected ?? 0) === 0) {
        return false
    }

    // Only after the card-flip won (single writer) do we stash the one-shot pre-approval, so a losing
    // double-tap can't leave a stray pre-approval behind.
    if (isLateApprovedApprovalGate) {
        await tryCatch(() => chatApprovalGate.storePreApproval({ conversationId: conversation.id, toolName: pendingPart.toolName, payload }))
    }
    await chatApprovalGate.clearPendingGate({ conversationId: conversation.id })

    await enqueueResumeTurn({
        conversation: { ...conversation, messages: messagesWithAnswer, uiMessages: resolvedUiMessages, status: ChatConversationStatus.IDLE },
        resumeKind: 'gate',
        log,
    })
    log.info({ conversation: { id: conversation.id }, gate: { id: gateId }, approved, lateApprovedExecution: isLateApprovedApprovalGate }, '[chatResume] Resolved parked gate and enqueued resume')
    return true
}

// A crashed run left the conversation STREAMING with a dead worker. If the turn had an OPEN gate
// (a persisted PENDING card), a crash resume would burn budget and inject a spurious note for a turn
// that is really just waiting on the user — so instead park it: flip STREAMING → IDLE, keep the
// PENDING card, re-assert the gate routing (harmless if the mapping is gone — Fix 2 keeps the card
// answerable via the persisted part), NO crash note, no resume job. A later answer resumes via
// resumeParkedGate. Returns 'parked' in that case.
//
// Otherwise (gateless): if this user turn still has resume budget, append a verify-before-redo note
// to the LLM history (which doubles as the durable resume counter), drop status to IDLE, and enqueue
// a crash resume — returns 'resumed'. When budget is spent, returns 'exhausted' so the caller falls
// back to the ERROR + interrupted-message path.
async function tryEnqueueCrashResume({ conversation, log }: {
    conversation: ChatConversation
    log: FastifyBaseLogger
}): Promise<CrashResumeOutcome> {
    const uiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
    const openGate = chatGateUtils.findAnyPendingGatePart({ uiMessages })
    if (!isNil(openGate)) {
        return parkOpenGate({ conversation, openGate, log })
    }

    const messages = conversation.messages as ModelMessage[]
    const resumesSpent = countCrashResumeNotes({ messages })
    if (resumesSpent >= CHAT_MAX_AUTO_RESUMES) {
        log.warn({ conversation: { id: conversation.id }, resumesSpent }, '[chatResume] Auto-resume budget exhausted — falling back to ERROR')
        return 'exhausted'
    }
    const messagesWithNote: ModelMessage[] = [
        ...messages,
        { role: 'user', content: CHAT_CRASH_RESUME_NOTE },
    ]
    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({
            messages: () => ':messages',
            status: ChatConversationStatus.IDLE,
            activeRunId: null,
        })
        .setParameter('messages', JSON.stringify(sanitizeObjectForPostgresql(messagesWithNote)))
        .where('id = :id AND status = :streaming', { id: conversation.id, streaming: ChatConversationStatus.STREAMING })
        .execute()
    if ((result.affected ?? 0) === 0) {
        return 'exhausted'
    }
    await tryCatch(() => chatApprovalGate.clearPendingGate({ conversationId: conversation.id }))
    const { error } = await tryCatch(() => enqueueResumeTurn({
        conversation: { ...conversation, messages: messagesWithNote, status: ChatConversationStatus.IDLE, activeRunId: null },
        resumeKind: 'crash',
        log,
    }))
    if (!isNil(error)) {
        // The IDLE flip + note landed but the job never enqueued (enqueueResumeTurn already rolled
        // activeRunId back). An IDLE row with a note but no job is invisible to the sweeper and no
        // user action unsticks it, so revert to STREAMING and strip the just-added note — the sweeper
        // then retries this conversation next cycle with an intact budget.
        await tryCatch(() => conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ messages: () => ':messages', status: ChatConversationStatus.STREAMING })
            .setParameter('messages', JSON.stringify(sanitizeObjectForPostgresql(messages)))
            .where('id = :id AND status = :idle', { id: conversation.id, idle: ChatConversationStatus.IDLE })
            .execute())
        log.error({ error, conversation: { id: conversation.id } }, '[chatResume] Crash-resume enqueue failed — reverted to STREAMING for sweeper retry')
        return 'exhausted'
    }
    log.info({ conversation: { id: conversation.id }, resumeAttempt: resumesSpent + 1 }, '[chatResume] Enqueued crash auto-resume')
    return 'resumed'
}

// Park a dead-worker turn that still has an open gate: fence STREAMING → IDLE, keep the PENDING card,
// clear activeRunId so a later resume can re-claim it. No crash note, no budget spent, no resume job —
// the turn simply becomes a parked turn that the user's answer will resume.
async function parkOpenGate({ conversation, openGate, log }: {
    conversation: ChatConversation
    openGate: PersistedToolCallPart
    log: FastifyBaseLogger
}): Promise<CrashResumeOutcome> {
    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({ status: ChatConversationStatus.IDLE, activeRunId: null })
        .where('id = :id AND status = :streaming', { id: conversation.id, streaming: ChatConversationStatus.STREAMING })
        .execute()
    if ((result.affected ?? 0) === 0) {
        return 'exhausted'
    }
    log.info({ conversation: { id: conversation.id }, gate: { id: openGate.toolCallId }, tool: { name: openGate.toolName } }, '[chatResume] Dead worker had an open gate — parked turn (no crash note, no budget spent)')
    return 'parked'
}

// Counts verify-before-redo notes since the last real user message, so a fresh user turn resets the
// budget. A resume never persists a normal user bubble, so any user message that is NOT the note
// marks the boundary of the current turn.
function countCrashResumeNotes({ messages }: { messages: ModelMessage[] }): number {
    let count = 0
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i]
        if (message.role !== 'user') continue
        if (typeof message.content === 'string' && message.content === CHAT_CRASH_RESUME_NOTE) {
            count++
            continue
        }
        break
    }
    return count
}

export const chatResume = {
    resumeParkedGate,
    tryEnqueueCrashResume,
}

// 'parked': turn had an open gate, flipped to IDLE keeping the card (answer will resume it).
// 'resumed': gateless crash resume was enqueued. 'exhausted': budget spent or lost the status race —
// caller should fall back to the ERROR path.
export type CrashResumeOutcome = 'parked' | 'resumed' | 'exhausted'
