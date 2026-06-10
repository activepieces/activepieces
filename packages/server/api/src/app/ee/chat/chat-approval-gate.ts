import { distributedStore, redisConnections } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 15 * 60
const CANCEL_TTL_SECONDS = 2 * 60 * 60

const CONNECTION_STORE_TTL_SECONDS = 24 * 60 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CHANNEL_PREFIX = 'tool-approval:'
const CANCEL_KEY_PREFIX = 'chat-cancel:'
const ACTIVE_RUN_PREFIX = 'chat-active-run:'
const AVAILABLE_CONNECTIONS_PREFIX = 'chat-conn-avail:'
const SELECTED_CONNECTION_PREFIX = 'chat-conn-sel:'
const PENDING_GATE_PREFIX = 'chat-pending-gate:'

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
        const conversationId = await distributedStore.get<string>(`${PENDING_GATE_PREFIX}gate:${gateId}`)
        if (conversationId) {
            await distributedStore.delete(`${PENDING_GATE_PREFIX}${conversationId}`)
            await distributedStore.delete(`${PENDING_GATE_PREFIX}gate:${gateId}`)
        }
    }
}

async function checkDecision({ gateId }: { gateId: string }): Promise<GateDecision | 'pending'> {
    const raw = await distributedStore.get<GateDecision>(decisionKey(gateId))
    if (!raw) return 'pending'
    return { approved: raw.approved === true, payload: raw.payload }
}

async function waitForDecision({ gateId, timeoutMs }: { gateId: string, timeoutMs: number }): Promise<GateDecision | 'pending'> {
    const channel = channelName(gateId)
    const subscriber = await redisConnections.create()

    return new Promise<GateDecision | 'pending'>((resolve) => {
        let settled = false

        const settle = (result: GateDecision | 'pending') => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            subscriber.unsubscribe(channel).catch(() => undefined).finally(() => subscriber.quit().catch(() => undefined))
            resolve(result)
        }

        const timeout = setTimeout(() => settle('pending'), timeoutMs)

        subscriber.on('message', (_ch, message) => {
            if (_ch !== channel) return
            try {
                const parsed = JSON.parse(message)
                settle({ approved: parsed.approved === true, payload: parsed.payload })
            }
            catch {
                settle('pending')
            }
        })

        // Subscribe first, then check — eliminates the race where resolveGate
        // publishes between a check and a subscribe
        void subscriber.subscribe(channel).then(async () => {
            const existing = await checkDecision({ gateId })
            if (existing !== 'pending') {
                settle(existing)
            }
        })
    })
}

async function requestCancel({ conversationId, runId }: { conversationId: string, runId?: string }): Promise<void> {
    const key = runId ? `${CANCEL_KEY_PREFIX}${conversationId}:${runId}` : `${CANCEL_KEY_PREFIX}${conversationId}`
    await distributedStore.put(key, { cancelled: true }, CANCEL_TTL_SECONDS)
}

async function isCancelled({ conversationId, runId }: { conversationId: string, runId?: string }): Promise<boolean> {
    if (!runId) {
        const raw = await distributedStore.get<{ cancelled: boolean }>(`${CANCEL_KEY_PREFIX}${conversationId}`)
        return raw?.cancelled === true
    }
    const [scoped, fallback] = await Promise.all([
        distributedStore.get<{ cancelled: boolean }>(`${CANCEL_KEY_PREFIX}${conversationId}:${runId}`),
        distributedStore.get<{ cancelled: boolean }>(`${CANCEL_KEY_PREFIX}${conversationId}`),
    ])
    return scoped?.cancelled === true || fallback?.cancelled === true
}

async function clearCancel({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.delete(`${CANCEL_KEY_PREFIX}${conversationId}`)
}

async function storeActiveRunId({ conversationId, runId }: { conversationId: string, runId: string }): Promise<void> {
    await distributedStore.put(`${ACTIVE_RUN_PREFIX}${conversationId}`, runId, CANCEL_TTL_SECONDS)
}

async function getActiveRunId({ conversationId }: { conversationId: string }): Promise<string | null> {
    return distributedStore.get<string>(`${ACTIVE_RUN_PREFIX}${conversationId}`)
}

async function storeAvailableConnections({ conversationId, pieceName, connections }: {
    conversationId: string
    pieceName: string
    connections: StoredConnection[]
}): Promise<void> {
    await distributedStore.put(`${AVAILABLE_CONNECTIONS_PREFIX}${conversationId}:${pieceName}`, connections, CONNECTION_STORE_TTL_SECONDS)
}

async function getAvailableConnections({ conversationId, pieceName }: {
    conversationId: string
    pieceName: string
}): Promise<StoredConnection[]> {
    return await distributedStore.get<StoredConnection[]>(`${AVAILABLE_CONNECTIONS_PREFIX}${conversationId}:${pieceName}`) ?? []
}

async function storeSelectedConnection({ conversationId, pieceName, externalId, label, projectId }: {
    conversationId: string
    pieceName: string
    externalId: string
    label: string
    projectId: string
}): Promise<void> {
    await distributedStore.put(`${SELECTED_CONNECTION_PREFIX}${conversationId}:${pieceName}`, { externalId, label, projectId }, CONNECTION_STORE_TTL_SECONDS)
}

async function getSelectedConnection({ conversationId, pieceName }: {
    conversationId: string
    pieceName: string
}): Promise<SelectedConnection | null> {
    return distributedStore.get<SelectedConnection>(`${SELECTED_CONNECTION_PREFIX}${conversationId}:${pieceName}`)
}

async function storePendingGate({ conversationId, gate }: {
    conversationId: string
    gate: PendingGate
}): Promise<void> {
    await Promise.all([
        distributedStore.put(`${PENDING_GATE_PREFIX}${conversationId}`, gate, GATE_TTL_SECONDS),
        distributedStore.put(`${PENDING_GATE_PREFIX}gate:${gate.gateId}`, conversationId, GATE_TTL_SECONDS),
    ])
}

async function getPendingGate({ conversationId }: { conversationId: string }): Promise<PendingGate | null> {
    return distributedStore.get<PendingGate>(`${PENDING_GATE_PREFIX}${conversationId}`)
}

async function clearPendingGate({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.delete(`${PENDING_GATE_PREFIX}${conversationId}`)
}

export const chatApprovalGate = {
    resolveGate,
    waitForDecision,
    requestCancel,
    isCancelled,
    clearCancel,
    storeActiveRunId,
    getActiveRunId,
    storeAvailableConnections,
    getAvailableConnections,
    storeSelectedConnection,
    getSelectedConnection,
    storePendingGate,
    getPendingGate,
    clearPendingGate,
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
}

type StoredConnection = {
    externalId: string
    label: string
    projectId: string
    project: string
    status: string
    grantedScopes: string[]
}

type SelectedConnection = Pick<StoredConnection, 'externalId' | 'label' | 'projectId'>

type PendingGate = {
    gateId: string
    toolName: string
    displayName: string
    toolInput: Record<string, unknown>
}
