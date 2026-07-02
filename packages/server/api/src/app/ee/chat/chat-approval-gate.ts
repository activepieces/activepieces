import { FastifyBaseLogger } from 'fastify'
import { distributedStore, redisConnections } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 15 * 60
const CANCEL_TTL_SECONDS = 2 * 60 * 60

const CONNECTION_STORE_TTL_SECONDS = 24 * 60 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CHANNEL_PREFIX = 'tool-approval:'
const CANCEL_KEY_PREFIX = 'chat-cancel:'
const AVAILABLE_CONNECTIONS_PREFIX = 'chat-conn-avail:'
const SELECTED_CONNECTION_PREFIX = 'chat-conn-sel:'
const PENDING_GATE_PREFIX = 'chat-pending-gate:'
const PRE_APPROVAL_PREFIX = 'chat-pre-approval:'
const PRE_APPROVAL_TTL_SECONDS = 15 * 60

function decisionKey(gateId: string): string {
    return `${KEY_PREFIX}${gateId}`
}

function channelName(gateId: string): string {
    return `${CHANNEL_PREFIX}${gateId}`
}

function preApprovalKey({ conversationId, toolName }: { conversationId: string, toolName: string }): string {
    return `${PRE_APPROVAL_PREFIX}${conversationId}:${toolName}`
}

// Records the decision and wakes any live worker still blocking on the gate. It is intentionally
// NON-DESTRUCTIVE: it never deletes the pending-gate mapping, so the caller can still resolve which
// conversation the gate belongs to and drive the correct path (live consume vs park vs recover)
// afterwards (Fix 3). The mapping is deleted only at a real consumption point — the live worker
// consuming the decision, or a successful parked-gate card-flip. Returns the owning conversation
// (mapping first) so the controller can route even after the fast-path window.
async function resolveGate({ gateId, approved, payload, log }: { gateId: string, approved: boolean, payload?: Record<string, unknown>, log?: FastifyBaseLogger }): Promise<{ conversationId: string | null }> {
    // Bind the decision to the exact inputs the user saw in the preview, so a consumer can verify
    // the action it's about to run matches what was approved (not a different payload reusing the id).
    const conversationId = await distributedStore.get<string>(`${PENDING_GATE_PREFIX}gate:${gateId}`)
    const pendingGate = conversationId ? await distributedStore.get<PendingGate>(`${PENDING_GATE_PREFIX}${conversationId}`) : null
    const approvedInput = pendingGate?.gateId === gateId ? pendingGate.toolInput : undefined
    const wasSet = await distributedStore.putIfAbsent(decisionKey(gateId), { approved, payload, approvedInput }, GATE_TTL_SECONDS)
    if (wasSet) {
        await pubsub.publish(channelName(gateId), JSON.stringify({ approved, payload }))
        log?.info({ gate: { id: gateId }, decision: approved ? 'approved' : 'denied' }, '[chatApprovalGate] Gate decided')
    }
    else {
        log?.info({ gate: { id: gateId } }, '[chatApprovalGate] Gate decision ignored (already decided)')
    }
    return { conversationId: conversationId ?? null }
}

// One-shot, single-use pre-approval for a late-approved approval-gate (Fix 1). The resumed model
// re-issues the action; the worker's gate-opening path consumes this instead of opening a second
// card, so the user is never asked twice. Keyed by (conversationId, toolName) — the pending
// approval-gate for a given tool is single at a time in a conversation.
async function storePreApproval({ conversationId, toolName, payload }: { conversationId: string, toolName: string, payload?: Record<string, unknown> }): Promise<void> {
    await distributedStore.put(preApprovalKey({ conversationId, toolName }), { approved: true, payload: payload ?? {} }, PRE_APPROVAL_TTL_SECONDS)
}

async function consumePreApproval({ conversationId, toolName }: { conversationId: string, toolName: string }): Promise<{ approved: boolean, payload?: Record<string, unknown> } | null> {
    return distributedStore.consume<{ approved: boolean, payload?: Record<string, unknown> }>(preApprovalKey({ conversationId, toolName }))
}

async function checkDecision({ gateId }: { gateId: string }): Promise<GateDecision | 'pending'> {
    const raw = await distributedStore.get<GateDecision>(decisionKey(gateId))
    if (!raw) return 'pending'
    return { approved: raw.approved === true, payload: raw.payload, approvedInput: raw.approvedInput }
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

// Deletes BOTH the conversation-keyed pending-gate record AND its reverse gate:{gateId}→conversationId
// index. resolveGate no longer prunes the mapping (Fix 3), so a leftover reverse key here would let a
// stale gateId keep resolving to a conversation after the gate is gone — clear both together.
async function clearPendingGate({ conversationId }: { conversationId: string }): Promise<void> {
    const pendingGate = await distributedStore.get<PendingGate>(`${PENDING_GATE_PREFIX}${conversationId}`)
    const keys = [`${PENDING_GATE_PREFIX}${conversationId}`]
    if (pendingGate?.gateId) {
        keys.push(`${PENDING_GATE_PREFIX}gate:${pendingGate.gateId}`)
    }
    await distributedStore.delete(keys)
}

export const chatApprovalGate = {
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
    getPendingGate,
    clearPendingGate,
    storePreApproval,
    consumePreApproval,
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
