import { createHash } from 'crypto'
import { isNil } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore, redisConnections } from '../../database/redis-connections'
import { pubsub } from '../../helper/pubsub'

const GATE_TTL_SECONDS = 15 * 60
const CANCEL_TTL_SECONDS = 2 * 60 * 60

const CONNECTION_STORE_TTL_SECONDS = 24 * 60 * 60
const KEY_PREFIX = 'tool-approval-decision:'
const CONSUMED_KEY_PREFIX = 'tool-approval-consumed:'
const CHANNEL_PREFIX = 'tool-approval:'
const CANCEL_KEY_PREFIX = 'chat-cancel:'
const AVAILABLE_CONNECTIONS_PREFIX = 'chat-conn-avail:'
const SELECTED_CONNECTION_PREFIX = 'chat-conn-sel:'
const PENDING_GATE_PREFIX = 'chat-pending-gate:'
const PRE_APPROVAL_PREFIX = 'chat-pre-approval:'
// 3 minutes (Fix R1c): a resume turn re-issues the approved action within seconds, so the token
// needs only a short life. A tight TTL also shrinks the window in which a stale token could leak to
// an unrelated later turn — and identity/runId binding fails such a token closed regardless.
const PRE_APPROVAL_TTL_SECONDS = 3 * 60

function decisionKey(gateId: string): string {
    return `${KEY_PREFIX}${gateId}`
}

function consumedKey(gateId: string): string {
    return `${CONSUMED_KEY_PREFIX}${gateId}`
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

// A stable hash of the approved tool input, so the resumed re-issue can be verified to be the SAME
// action the user approved — not a different payload the model happens to route through the same tool
// (Fix R1). Keys are sorted so field ordering never changes the digest.
function hashToolInput(input: Record<string, unknown> | undefined): string {
    return createHash('sha256').update(stableStringify(input ?? {})).digest('hex')
}

function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
        return `{${entries.join(',')}}`
    }
    return JSON.stringify(value) ?? 'null'
}

// The identity of the specific action a user approved: what tool, which piece/action (or flow), and a
// digest of the exact input previewed on the card. A pre-approval is only honored when a re-issued
// action matches this identity AND the token's owning resume run — so a token can never auto-approve a
// DIFFERENT write, and never leaks to an unrelated later turn (Fix R1a/b).
function buildPreApprovalIdentity({ toolName, toolInput }: { toolName: string, toolInput?: Record<string, unknown> }): PreApprovalIdentity {
    if (toolName === 'ap_execute_action') {
        return {
            pieceName: typeof toolInput?.pieceName === 'string' ? toolInput.pieceName : null,
            actionName: typeof toolInput?.actionName === 'string' ? toolInput.actionName : null,
            inputHash: hashToolInput(toolInput),
        }
    }
    if (toolName === 'ap_test_flow') {
        return {
            flowId: typeof toolInput?.flowId === 'string' ? toolInput.flowId : null,
            inputHash: hashToolInput(toolInput),
        }
    }
    return { inputHash: hashToolInput(toolInput) }
}

// One-shot, single-use pre-approval for a late-approved approval-gate (Fix 1/R1). The resumed model
// re-issues the action; the worker's gate-opening path consumes this instead of opening a second
// card, so the user is never asked twice. Keyed by (conversationId, toolName). The stored value binds
// the approved action's identity (piece/action or flowId + input hash) and the resume runId, so the
// consumer must present a matching re-issue — a mismatch fails closed (a fresh card opens).
//
// Never called for ap_send_email: its card deliberately re-opens on resume (the SMTP boundary
// re-verifies the exact recipients/subject/body), so storing a token here would only orphan.
async function storePreApproval({ conversationId, toolName, toolInput, runId, payload }: {
    conversationId: string
    toolName: string
    toolInput?: Record<string, unknown>
    runId?: string
    payload?: Record<string, unknown>
}): Promise<void> {
    if (toolName === 'ap_send_email') {
        return
    }
    const value: StoredPreApproval = {
        approved: true,
        payload: payload ?? {},
        identity: buildPreApprovalIdentity({ toolName, toolInput }),
        runId: runId ?? null,
    }
    await distributedStore.put(preApprovalKey({ conversationId, toolName }), value, PRE_APPROVAL_TTL_SECONDS)
}

// Atomically read-and-delete the token, then verify the re-issued call matches the approved identity
// and the current resume run. On any mismatch we still consumed the token (GETDEL) — that is
// intentional fail-closed: a stale/mismatched token is destroyed and a normal card opens, so it can
// neither auto-approve the wrong write nor linger to leak into a later turn.
async function consumePreApproval({ conversationId, toolName, toolInput, runId }: {
    conversationId: string
    toolName: string
    toolInput?: Record<string, unknown>
    runId?: string
}): Promise<{ approved: boolean, payload?: Record<string, unknown> } | null> {
    const stored = await distributedStore.consume<StoredPreApproval>(preApprovalKey({ conversationId, toolName }))
    if (isNil(stored)) {
        return null
    }
    const reissued = buildPreApprovalIdentity({ toolName, toolInput })
    const identityMatches = identitiesMatch(stored.identity, reissued)
    const runMatches = isNil(stored.runId) || isNil(runId) || stored.runId === runId
    if (!identityMatches || !runMatches) {
        return { approved: false }
    }
    return { approved: true, payload: stored.payload }
}

function identitiesMatch(a: PreApprovalIdentity, b: PreApprovalIdentity): boolean {
    return a.inputHash === b.inputHash
        && (a.pieceName ?? null) === (b.pieceName ?? null)
        && (a.actionName ?? null) === (b.actionName ?? null)
        && (a.flowId ?? null) === (b.flowId ?? null)
}

// Observable-consumption marker (Fix R2). A live worker's __approval_wait RPC sets this the instant
// it hands a real (non-pending) decision back to the worker — i.e. the moment the live path consumed
// the answer. The controller's dead-STREAMING handshake polls wasGateConsumed to tell "a live worker
// took this" from "the worker is truly dead", so it never parks (and double-executes) a live turn.
async function markGateConsumed({ gateId }: { gateId: string }): Promise<void> {
    await distributedStore.put(consumedKey(gateId), { consumed: true }, GATE_TTL_SECONDS)
}

async function wasGateConsumed({ gateId }: { gateId: string }): Promise<boolean> {
    const raw = await distributedStore.get<{ consumed: boolean }>(consumedKey(gateId))
    return raw?.consumed === true
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
    markGateConsumed,
    wasGateConsumed,
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

type PreApprovalIdentity = {
    pieceName?: string | null
    actionName?: string | null
    flowId?: string | null
    inputHash: string
}

type StoredPreApproval = {
    approved: boolean
    payload?: Record<string, unknown>
    identity: PreApprovalIdentity
    runId: string | null
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
