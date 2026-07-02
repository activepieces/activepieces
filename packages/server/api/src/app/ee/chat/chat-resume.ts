import { apId, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { CHAT_CRASH_RESUME_NOTE, CHAT_MAX_AUTO_RESUMES, ChatConversation, ChatConversationStatus, LATEST_JOB_DATA_SCHEMA_VERSION, PersistedChatMessage, PersistedChatPartType, PersistedToolCallPart, PersistedToolCallStatus, WorkerJobType } from '@activepieces/shared'
import { ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'
import { chatApprovalGate } from './chat-approval-gate'
import { chatHelpers } from './chat-helpers'

// Enqueues one resume turn — a normal EXECUTE_CHAT_AGENT job with no user message. getChatConfig
// keys off resumeKind to rebuild the LLM history from what we just persisted (an answered gate's
// tool result, or a crash-resume note) instead of appending a user bubble. Claims a fresh runId as
// the conversation's active run so late writes from the dead/parked run are fenced out.
async function enqueueResumeTurn({ conversation, resumeKind, log }: {
    conversation: ChatConversation
    resumeKind: 'gate' | 'crash'
    log: FastifyBaseLogger
}): Promise<void> {
    const runId = apId()
    await chatHelpers.conversationRepo().update(conversation.id, { activeRunId: runId })
    await jobQueue(log).add({
        id: apId(),
        type: JobType.ONE_TIME,
        data: {
            schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            jobType: WorkerJobType.EXECUTE_CHAT_AGENT,
            conversationId: conversation.id,
            runId,
            projectId: conversation.projectId ?? null,
            platformId: conversation.platformId,
            userId: conversation.userId,
            userMessage: '',
            modelName: conversation.modelName ?? null,
            resumeKind,
        },
    })
    log.info({ conversation: { id: conversation.id }, run: { id: runId }, resumeKind }, '[chatResume] Enqueued resume turn')
}

// A user answered a gate whose turn is gone (parked/dead). Persist the answer as the tool result of
// the still-PENDING gate tool-call — both in the LLM history (so the model sees its own question
// carrying the answer and just continues) and in uiMessages (flip the card PENDING → completed) —
// then enqueue a resume turn. Idempotent: if the gate part is already resolved (a live worker beat
// us, or a double-tap), it does nothing and returns false so the caller skips the resume.
async function resumeParkedGate({ conversation, gateId, approved, payload, log }: {
    conversation: ChatConversation
    gateId: string
    approved: boolean
    payload?: Record<string, unknown>
    log: FastifyBaseLogger
}): Promise<boolean> {
    const uiMessages = (conversation.uiMessages ?? []) as PersistedChatMessage[]
    const pendingPart = findPendingGatePart({ uiMessages, gateId })
    if (isNil(pendingPart)) {
        return false
    }

    const output = { ...(payload ?? {}), approved }
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

    const result = await chatHelpers.conversationRepo()
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
    await chatApprovalGate.clearPendingGate({ conversationId: conversation.id })

    await enqueueResumeTurn({
        conversation: { ...conversation, messages: messagesWithAnswer, uiMessages: resolvedUiMessages, status: ChatConversationStatus.IDLE },
        resumeKind: 'gate',
        log,
    })
    log.info({ conversation: { id: conversation.id }, gate: { id: gateId }, approved }, '[chatResume] Resolved parked gate and enqueued resume')
    return true
}

// A crashed run left the conversation STREAMING with a dead worker. If this user turn hasn't spent
// its auto-resume budget yet, append a verify-before-redo note to the LLM history (which doubles as
// the durable, restart-surviving resume counter), drop status to IDLE so getChatConfig can re-lock,
// and enqueue a crash resume. Returns true if a resume was scheduled; false means the caller should
// fall back to the ERROR + interrupted-message path (budget exhausted).
async function tryEnqueueCrashResume({ conversation, log }: {
    conversation: ChatConversation
    log: FastifyBaseLogger
}): Promise<boolean> {
    const messages = conversation.messages as ModelMessage[]
    const resumesSpent = countCrashResumeNotes({ messages })
    if (resumesSpent >= CHAT_MAX_AUTO_RESUMES) {
        log.warn({ conversation: { id: conversation.id }, resumesSpent }, '[chatResume] Auto-resume budget exhausted — falling back to ERROR')
        return false
    }
    const messagesWithNote: ModelMessage[] = [
        ...messages,
        { role: 'user', content: CHAT_CRASH_RESUME_NOTE },
    ]
    const result = await chatHelpers.conversationRepo()
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
        return false
    }
    await tryCatch(() => chatApprovalGate.clearPendingGate({ conversationId: conversation.id }))
    await enqueueResumeTurn({
        conversation: { ...conversation, messages: messagesWithNote, status: ChatConversationStatus.IDLE, activeRunId: null },
        resumeKind: 'crash',
        log,
    })
    log.info({ conversation: { id: conversation.id }, resumeAttempt: resumesSpent + 1 }, '[chatResume] Enqueued crash auto-resume')
    return true
}

function findPendingGatePart({ uiMessages, gateId }: { uiMessages: PersistedChatMessage[], gateId: string }): PersistedToolCallPart | null {
    for (const message of uiMessages) {
        for (const part of message.parts) {
            if (part.type === PersistedChatPartType.TOOL_CALL && part.toolCallId === gateId && part.status === PersistedToolCallStatus.PENDING) {
                return part
            }
        }
    }
    return null
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
