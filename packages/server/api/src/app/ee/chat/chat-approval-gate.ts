import { distributedStore } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 15 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CHANNEL_PREFIX = 'tool-approval:'

function decisionKey(gateId: string): string {
    return `${KEY_PREFIX}${gateId}`
}

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

async function resolveGate({ gateId, approved, payload }: { gateId: string, approved: boolean, payload?: Record<string, unknown> }): Promise<void> {
    await distributedStore.put(decisionKey(gateId), { approved, payload }, GATE_TTL_SECONDS)
    await pubsub.publish(channelName(gateId), JSON.stringify({ approved, payload }))
}

async function checkDecision({ gateId }: { gateId: string }): Promise<GateDecision | 'pending'> {
    const raw = await distributedStore.get<GateDecision>(decisionKey(gateId))
    if (!raw) return 'pending'
    return { approved: raw.approved === true, payload: raw.payload }
}

export const chatApprovalGate = {
    resolveGate,
    checkDecision,
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
}
