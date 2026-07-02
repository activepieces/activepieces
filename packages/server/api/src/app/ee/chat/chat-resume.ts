import { apId, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { CHAT_CRASH_RESUME_NOTE, CHAT_LATE_APPROVAL_MARKER, CHAT_LATE_APPROVAL_MARKER_EMAIL, CHAT_MAX_AUTO_RESUMES, ChatConversation, ChatConversationStatus, chatToolClassification, PersistedChatMessage, PersistedChatPartType, PersistedToolCallPart, PersistedToolCallStatus } from '@activepieces/shared'
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
async function enqueueResumeTurn({ conversation, resumeKind, preClaimedRunId, beforeEnqueue, log }: {
    conversation: ChatConversation
    resumeKind: 'gate' | 'crash'
    // When the caller already claimed the resume run atomically in its own parks/flips UPDATE (Fix
    // R2, closing the activeRunId=NULL window a zombie worker could write through), pass it here so we
    // reuse it instead of claiming a second one.
    preClaimedRunId?: string
    beforeEnqueue?: (params: { runId: string }) => Promise<void>
    log: FastifyBaseLogger
}): Promise<void> {
    const runId = preClaimedRunId ?? apId()
    const previousActiveRunId = conversation.activeRunId ?? null
    if (isNil(preClaimedRunId)) {
        await conversationRepo().update(conversation.id, { activeRunId: runId })
    }
    // Bind anything that must reference the resume run (e.g. a one-shot pre-approval — Fix R1) AFTER
    // the run is claimed but BEFORE the job is enqueued, so the token carries this run's id and the
    // worker can never pick the job up before it exists.
    if (beforeEnqueue) {
        await tryCatch(() => beforeEnqueue({ runId }))
    }
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
        // When we claimed activeRunId here, roll it back. When the caller pre-claimed it (gate path),
        // leave the row as-is: the caller's fenced revert (revertGateFlip) owns undoing its own flip
        // AND clearing activeRunId, so a rollback here would race it.
        if (isNil(preClaimedRunId)) {
            await tryCatch(() => conversationRepo().update(conversation.id, { activeRunId: previousActiveRunId }))
        }
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
    // Email re-opens its card on resume (no pre-approval token, SMTP boundary re-verifies), so its
    // marker must NOT tell the model "do not ask again" (Fix R1d).
    const isEmailGate = pendingPart.toolName === 'ap_send_email'
    const output = isLateApprovedApprovalGate
        ? { ...(isEmailGate ? CHAT_LATE_APPROVAL_MARKER_EMAIL : CHAT_LATE_APPROVAL_MARKER) }
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

    // Claim the resume run in the SAME UPDATE that flips the card (Fix R2): a parked turn left
    // activeRunId NULL, and NULL passes every "activeRunId IS NULL OR = :runId" fence — so a zombie
    // worker could write through the gap between park and the resume claim. Setting activeRunId here,
    // atomically with the flip, leaves no NULL window for the resume path.
    const resumeRunId = apId()
    const result = await conversationRepo()
        .createQueryBuilder()
        .update()
        .set({
            messages: () => ':messages',
            uiMessages: () => ':uiMessages',
            status: ChatConversationStatus.IDLE,
            activeRunId: resumeRunId,
        })
        .setParameter('messages', JSON.stringify(sanitizeObjectForPostgresql(messagesWithAnswer)))
        .setParameter('uiMessages', JSON.stringify(sanitizeObjectForPostgresql(resolvedUiMessages)))
        .where('id = :id AND status != :streaming', { id: conversation.id, streaming: ChatConversationStatus.STREAMING })
        .execute()
    if ((result.affected ?? 0) === 0) {
        return false
    }
    await chatApprovalGate.clearPendingGate({ conversationId: conversation.id })

    const { error } = await tryCatch(() => enqueueResumeTurn({
        conversation: { ...conversation, messages: messagesWithAnswer, uiMessages: resolvedUiMessages, status: ChatConversationStatus.IDLE, activeRunId: resumeRunId },
        resumeKind: 'gate',
        preClaimedRunId: resumeRunId,
        // Bind the one-shot pre-approval to THIS resume run and the exact approved input (Fix R1). It
        // is stored only after the card-flip won (single writer) and only once the run is claimed, so
        // a losing double-tap can't leave a stray token and the token can't leak to an unrelated turn.
        // storePreApproval is a no-op for ap_send_email (its card re-opens on resume — Fix R1d).
        beforeEnqueue: isLateApprovedApprovalGate
            ? ({ runId }) => chatApprovalGate.storePreApproval({
                conversationId: conversation.id,
                toolName: pendingPart.toolName,
                toolInput: pendingPart.input,
                runId,
                payload,
            })
            : undefined,
        log,
    }))
    if (!isNil(error)) {
        // Mirror the F8 revert on the gate path (Fix R5c): the card-flip landed but the resume job
        // never enqueued. Restore the PENDING card and pending-gate mapping — fenced on the row still
        // carrying OUR resume run id (a new user send would have overwritten it, and then owns the
        // row) — and report failure so the client keeps the answered card up.
        await revertGateFlip({ conversation, gateId, pendingPart, resumeRunId, log })
        log.error({ error, conversation: { id: conversation.id }, gate: { id: gateId } }, '[chatResume] Gate resume enqueue failed — reverted card flip')
        return false
    }
    log.info({ conversation: { id: conversation.id }, gate: { id: gateId }, approved, lateApprovedExecution: isLateApprovedApprovalGate }, '[chatResume] Resolved parked gate and enqueued resume')
    return true
}

// Undo a gate card-flip whose resume job failed to enqueue (Fix R5c). Flips the resolved card back to
// PENDING, clears activeRunId, and re-stores the pending-gate mapping so the card is answerable again.
// Fenced on the row still carrying our resume run id: if a new user send has since re-claimed the row
// (overwriting activeRunId) we walk away — the new turn owns it — rather than clobbering it back to a
// stale gate.
async function revertGateFlip({ conversation, gateId, pendingPart, resumeRunId, log }: {
    conversation: ChatConversation
    gateId: string
    pendingPart: PersistedToolCallPart
    resumeRunId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const storedUiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
    const revertedUiMessages = storedUiMessages.map((message) => ({
        ...message,
        parts: message.parts.map((part) => part.type === PersistedChatPartType.TOOL_CALL && part.toolCallId === gateId
            ? { ...part, status: PersistedToolCallStatus.PENDING, output: undefined }
            : part),
    }))
    const result = await tryCatch(() => conversationRepo()
        .createQueryBuilder()
        .update()
        .set({
            messages: () => ':messages',
            uiMessages: () => ':uiMessages',
            activeRunId: null,
        })
        .setParameter('messages', JSON.stringify(sanitizeObjectForPostgresql(conversation.messages)))
        .setParameter('uiMessages', JSON.stringify(sanitizeObjectForPostgresql(revertedUiMessages)))
        .where('id = :id AND "activeRunId" = :resumeRunId', { id: conversation.id, resumeRunId })
        .execute())
    if (!isNil(result.error) || (result.data?.affected ?? 0) === 0) {
        log.warn({ conversation: { id: conversation.id }, gate: { id: gateId } }, '[chatResume] Gate-flip revert skipped — row re-claimed by a new turn or write failed')
        return
    }
    await tryCatch(() => chatApprovalGate.storePendingGate({
        conversationId: conversation.id,
        gate: {
            gateId,
            toolName: pendingPart.toolName,
            displayName: pendingPart.title ?? pendingPart.toolName,
            toolInput: pendingPart.input,
        },
    }))
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
    // Park ONLY for a LIVE gate (Fix R3b): a PENDING card on the latest assistant message, or one that
    // still matches the pending-gate store entry for this conversation. A fossil card the user
    // abandoned (superseded on the next send, or sitting under a later user turn) must NOT hijack this
    // crash into a park — that would silently lose the turn. Otherwise proceed to crash-resume.
    const openGate = chatGateUtils.findLiveGatePart({ uiMessages })
        ?? await findStoredGatePart({ conversation, uiMessages })
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
        // activeRunId back to null). An IDLE row with a note but no job is invisible to the sweeper and
        // no user action unsticks it, so revert to STREAMING and strip the just-added note — the
        // sweeper then retries this conversation next cycle with an intact budget.
        //
        // Fence the revert on activeRunId IS NULL (Fix R4): a user who re-sent between our flip and
        // this failure has already claimed the row (set activeRunId + STREAMING via getChatConfig). A
        // bare status=IDLE revert would race that new turn — flipping it to STREAMING under a runId
        // this crash-resume no longer owns, so the accepted message dies on the STREAMING lock. If the
        // fence loses, the new turn owns the row; we walk away. Any crash note we appended is harmless:
        // it is a benign system-style user line the new turn will simply carry as prior context — never
        // a dangling status/lock, which is what would actually break the user's turn.
        // Restore the crashed worker's activeRunId too — leaving it NULL would turn every
        // "activeRunId IS NULL OR = :runId" fence into a no-op while the row sits STREAMING, letting
        // any stale re-delivered job write through until the sweeper retries. STREAMING + the original
        // runId is the exact pre-crash state, which the sweeper handles on the next cycle.
        const revert = await tryCatch(() => conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ messages: () => ':messages', status: ChatConversationStatus.STREAMING, activeRunId: conversation.activeRunId ?? null })
            .setParameter('messages', JSON.stringify(sanitizeObjectForPostgresql(messages)))
            .where('id = :id AND status = :idle AND "activeRunId" IS NULL', { id: conversation.id, idle: ChatConversationStatus.IDLE })
            .execute())
        if (!isNil(revert.error) || (revert.data?.affected ?? 0) === 0) {
            log.warn({ conversation: { id: conversation.id } }, '[chatResume] Crash-resume revert skipped — a new turn re-claimed the row')
            return 'exhausted'
        }
        log.error({ error, conversation: { id: conversation.id } }, '[chatResume] Crash-resume enqueue failed — reverted to STREAMING for sweeper retry')
        return 'exhausted'
    }
    log.info({ conversation: { id: conversation.id }, resumeAttempt: resumesSpent + 1 }, '[chatResume] Enqueued crash auto-resume')
    return 'resumed'
}

// A gate is still live if the pending-gate store holds an entry for this conversation whose gateId
// still resolves to a PENDING card in history (Fix R3b). This is the store-backed complement to the
// latest-assistant-message check: a gate the worker persisted but that isn't the trailing message yet
// (rare interleaving) is still legitimately live if the store points at it.
async function findStoredGatePart({ conversation, uiMessages }: {
    conversation: ChatConversation
    uiMessages: PersistedChatMessage[]
}): Promise<PersistedToolCallPart | null> {
    const { data: storedGate } = await tryCatch(() => chatApprovalGate.getPendingGate({ conversationId: conversation.id }))
    if (isNil(storedGate)) {
        return null
    }
    return chatGateUtils.findPendingGatePart({ uiMessages, gateId: storedGate.gateId })
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
