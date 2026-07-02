import { normalizePieceName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
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
const BROWSER_SESSION_PREFIX = 'chat-browser-session:'
// Aligned with the Firecrawl session's own ttl (set on creation in the worker). A parked browser
// outlives the turn that opened it so a follow-up message ("now submit") resumes the same page.
const BROWSER_SESSION_TTL_SECONDS = 30 * 60

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
    const pendingGate = conversationId ? await distributedStore.get<PendingGate>(`${PENDING_GATE_PREFIX}${conversationId}`) : null
    const approvedInput = pendingGate?.gateId === gateId ? pendingGate.toolInput : undefined
    const wasSet = await distributedStore.putIfAbsent(decisionKey(gateId), { approved, payload, approvedInput }, GATE_TTL_SECONDS)
    if (wasSet) {
        await pubsub.publish(channelName(gateId), JSON.stringify({ approved, payload }))
        if (conversationId) {
            await distributedStore.delete(`${PENDING_GATE_PREFIX}${conversationId}`)
            await distributedStore.delete(`${PENDING_GATE_PREFIX}gate:${gateId}`)
        }
        log?.info({ gate: { id: gateId }, decision: approved ? 'approved' : 'denied' }, '[chatApprovalGate] Gate decided')
    }
    else {
        log?.info({ gate: { id: gateId } }, '[chatApprovalGate] Gate decision ignored (already decided)')
    }
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
    await distributedStore.put(`${AVAILABLE_CONNECTIONS_PREFIX}${conversationId}:${normalizePieceName(pieceName)}`, connections, CONNECTION_STORE_TTL_SECONDS)
}

async function getAvailableConnections({ conversationId, pieceName }: {
    conversationId: string
    pieceName: string
}): Promise<StoredConnection[]> {
    return await distributedStore.get<StoredConnection[]>(`${AVAILABLE_CONNECTIONS_PREFIX}${conversationId}:${normalizePieceName(pieceName)}`) ?? []
}

async function storeSelectedConnection({ conversationId, pieceName, externalId, label, projectId }: {
    conversationId: string
    pieceName: string
    externalId: string
    label: string
    projectId: string
}): Promise<void> {
    await distributedStore.put(`${SELECTED_CONNECTION_PREFIX}${conversationId}:${normalizePieceName(pieceName)}`, { externalId, label, projectId }, CONNECTION_STORE_TTL_SECONDS)
}

async function getSelectedConnection({ conversationId, pieceName }: {
    conversationId: string
    pieceName: string
}): Promise<SelectedConnection | null> {
    return distributedStore.get<SelectedConnection>(`${SELECTED_CONNECTION_PREFIX}${conversationId}:${normalizePieceName(pieceName)}`)
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

async function storeBrowserSession({ conversationId, session }: {
    conversationId: string
    session: StoredBrowserSession
}): Promise<void> {
    await distributedStore.put(`${BROWSER_SESSION_PREFIX}${conversationId}`, session, BROWSER_SESSION_TTL_SECONDS)
}

async function getBrowserSession({ conversationId }: { conversationId: string }): Promise<StoredBrowserSession | null> {
    return distributedStore.get<StoredBrowserSession>(`${BROWSER_SESSION_PREFIX}${conversationId}`)
}

async function clearBrowserSession({ conversationId }: { conversationId: string }): Promise<void> {
    await distributedStore.delete(`${BROWSER_SESSION_PREFIX}${conversationId}`)
}

export const chatApprovalGate = {
    resolveGate,
    waitForDecision,
    checkDecision,
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
    storeBrowserSession,
    getBrowserSession,
    clearBrowserSession,
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

type StoredBrowserSession = {
    id: string
    liveViewUrl: string
    interactiveLiveViewUrl?: string
    navigated?: string
    interactiveSignaled?: boolean
    toolCallId?: string
}
