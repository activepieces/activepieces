import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 15 * 60
const CANCEL_TTL_SECONDS = 2 * 60 * 60

const CONNECTION_STORE_TTL_SECONDS = 24 * 60 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CHANNEL_PREFIX = 'tool-approval:'
const CANCEL_KEY_PREFIX = 'chat-cancel:'
const AVAILABLE_CONNECTIONS_PREFIX = 'chat-conn-avail:'
const SELECTED_CONNECTION_PREFIX = 'chat-conn-sel:'
const PENDING_GATE_PREFIX = 'chat-pending-gate:v2:'
const PREPARED_TOOL_PREFIX = 'agent-prepared-tool:'

function decisionKey(gateId: string): string {
    return `${KEY_PREFIX}${gateId}`
}

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

async function resolveGate({ gateId, approved, payload, log }: { gateId: string, approved: boolean, payload?: Record<string, unknown>, log?: FastifyBaseLogger }): Promise<void> {
    // Bind the decision to the exact inputs the user saw in the preview, so a consumer can verify
    // the action it's about to run matches what was approved (not a different payload reusing the id).
    const conversationId = await distributedStore.get<string>(`${PENDING_GATE_PREFIX}gate:${gateId}`)
    const pendingGate = conversationId ? (await readPendingGates({ conversationId }))[gateId] : undefined
    const approvedInput = pendingGate?.toolInput
    const wasSet = await distributedStore.putIfAbsent(decisionKey(gateId), { approved, payload, approvedInput }, GATE_TTL_SECONDS)
    if (wasSet) {
        await pubsub.publish(channelName(gateId), JSON.stringify({ approved, payload }))
        if (conversationId && !approved) {
            await discardPreparedTool({ conversationId, preparedId: gateId })
        }
        if (conversationId) {
            await distributedStore.removeField(`${PENDING_GATE_PREFIX}${conversationId}`, gateId)
            await distributedStore.delete(`${PENDING_GATE_PREFIX}gate:${gateId}`)
        }
        log?.info({ gate: { id: gateId }, decision: approved ? 'approved' : 'denied' }, '[agentApprovalGate] Gate decided')
    }
    else {
        log?.info({ gate: { id: gateId } }, '[agentApprovalGate] Gate decision ignored (already decided)')
    }
}

async function checkDecision({ gateId }: { gateId: string }): Promise<GateDecision | 'pending'> {
    const raw = await distributedStore.get<GateDecision>(decisionKey(gateId))
    if (!raw) return 'pending'
    return { approved: raw.approved === true, payload: raw.payload, approvedInput: raw.approvedInput }
}

async function waitForDecision({ gateId, timeoutMs }: { gateId: string, timeoutMs: number }): Promise<GateDecision | 'pending'> {
    const channel = channelName(gateId)

    return new Promise<GateDecision | 'pending'>((resolve) => {
        let settled = false

        const listener = (message: string): void => {
            try {
                const parsed = JSON.parse(message)
                settle({ approved: parsed.approved === true, payload: parsed.payload })
            }
            catch {
                settle('pending')
            }
        }

        const settle = (result: GateDecision | 'pending'): void => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            void pubsub.unsubscribe(channel, listener)
            resolve(result)
        }

        const timeout = setTimeout(() => settle('pending'), timeoutMs)

        // Subscribe first, then check — eliminates the race where resolveGate
        // publishes between a check and a subscribe
        void pubsub.subscribe(channel, listener).then(async () => {
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
    const key = runId
        ? `${CANCEL_KEY_PREFIX}${conversationId}:${runId}`
        : `${CANCEL_KEY_PREFIX}${conversationId}`
    const raw = await distributedStore.get<{ cancelled: boolean }>(key)
    return raw?.cancelled === true
}

async function clearCancel({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.delete(`${CANCEL_KEY_PREFIX}${conversationId}`)
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

function preparedToolKey({ conversationId, preparedId }: { conversationId: string, preparedId: string }): string {
    return `${PREPARED_TOOL_PREFIX}${conversationId}:${preparedId}`
}

async function storePreparedTool({ conversationId, preparedId, prepared }: {
    conversationId: string
    preparedId: string
    prepared: PreparedTool
}): Promise<void> {
    await distributedStore.put(preparedToolKey({ conversationId, preparedId }), prepared, GATE_TTL_SECONDS)
}

async function takePreparedTool({ conversationId, preparedId }: {
    conversationId: string
    preparedId: string
}): Promise<PreparedTool | null> {
    return distributedStore.take<PreparedTool>(preparedToolKey({ conversationId, preparedId }))
}

async function discardPreparedTool({ conversationId, preparedId }: {
    conversationId: string
    preparedId: string
}): Promise<void> {
    await distributedStore.delete(preparedToolKey({ conversationId, preparedId }))
}

async function storePendingGate({ conversationId, gate }: {
    conversationId: string
    gate: PendingGate
}): Promise<void> {
    await Promise.all([
        distributedStore.merge(`${PENDING_GATE_PREFIX}${conversationId}`, { [gate.gateId]: gate }, GATE_TTL_SECONDS),
        distributedStore.put(`${PENDING_GATE_PREFIX}gate:${gate.gateId}`, conversationId, GATE_TTL_SECONDS),
    ])
}

async function readPendingGates({ conversationId }: { conversationId: string }): Promise<Record<string, PendingGate>> {
    return await distributedStore.hgetJson<Record<string, PendingGate>>(`${PENDING_GATE_PREFIX}${conversationId}`) ?? {}
}

async function getPendingGates({ conversationId }: { conversationId: string }): Promise<PendingGate[]> {
    return Object.values(await readPendingGates({ conversationId }))
}

async function conversationIdForGate({ gateId }: { gateId: string }): Promise<string | null> {
    return distributedStore.get<string>(`${PENDING_GATE_PREFIX}gate:${gateId}`)
}

async function clearPendingGate({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.delete(`${PENDING_GATE_PREFIX}${conversationId}`)
}

export const agentApprovalGate = {
    resolveGate,
    checkDecision,
    waitForDecision,
    requestCancel,
    isCancelled,
    clearCancel,
    storeAvailableConnections,
    getAvailableConnections,
    storeSelectedConnection,
    getSelectedConnection,
    storePendingGate,
    getPendingGates,
    conversationIdForGate,
    storePreparedTool,
    takePreparedTool,
    discardPreparedTool,
    clearPendingGate,
}

export type PreparedTool = {
    input: Record<string, unknown>
    piece: { pieceName: string, actionName: string, pieceVersion?: string }
    needsApproval: boolean
}

type GateDecision = {
    approved: boolean
    payload?: Record<string, unknown>
    approvedInput?: Record<string, unknown>
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
    runId?: string
}
