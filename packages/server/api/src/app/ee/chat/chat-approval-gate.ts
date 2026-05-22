import { distributedStore } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 5 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CHANNEL_PREFIX = 'tool-approval:'

function decisionKey(gateId: string): string {
    return `${KEY_PREFIX}${gateId}`
}

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

async function resolveGate({ gateId, approved }: { gateId: string, approved: boolean }): Promise<void> {
    await distributedStore.put(decisionKey(gateId), { approved }, GATE_TTL_SECONDS)
    await pubsub.publish(channelName(gateId), JSON.stringify({ approved }))
}

async function checkDecision({ gateId }: { gateId: string }): Promise<boolean | 'pending'> {
    const raw = await distributedStore.get<{ approved: boolean }>(decisionKey(gateId))
    if (!raw) return 'pending'
    return raw.approved === true
}

export const chatApprovalGate = {
    resolveGate,
    checkDecision,
}
