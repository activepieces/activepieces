import { distributedStore } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 15 * 60
const CANCEL_TTL_SECONDS = 10 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CHANNEL_PREFIX = 'tool-approval:'
const CANCEL_KEY_PREFIX = 'chat-cancel:'

function decisionKey(gateId: string): string {
    return `${KEY_PREFIX}${gateId}`
}

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

async function resolveGate({ gateId, approved, payload }: { gateId: string, approved: boolean, payload?: Record<string, unknown> }): Promise<void> {
    const wasSet = await distributedStore.putIfAbsent(decisionKey(gateId), { approved, payload }, GATE_TTL_SECONDS)
    if (wasSet) {
        await pubsub.publish(channelName(gateId), JSON.stringify({ approved, payload }))
    }
}

async function checkDecision({ gateId }: { gateId: string }): Promise<GateDecision | 'pending'> {
    const raw = await distributedStore.get<GateDecision>(decisionKey(gateId))
    if (!raw) return 'pending'
    return { approved: raw.approved === true, payload: raw.payload }
}

async function requestCancel({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.put(`${CANCEL_KEY_PREFIX}${conversationId}`, { cancelled: true }, CANCEL_TTL_SECONDS)
}

async function isCancelled({ conversationId }: { conversationId: string }): Promise<boolean> {
    const raw = await distributedStore.get<{ cancelled: boolean }>(`${CANCEL_KEY_PREFIX}${conversationId}`)
    return raw?.cancelled === true
}

async function clearCancel({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.delete(`${CANCEL_KEY_PREFIX}${conversationId}`)
}

export const chatApprovalGate = {
    resolveGate,
    checkDecision,
    requestCancel,
    isCancelled,
    clearCancel,
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
}
