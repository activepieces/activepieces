import { ChatConversationStatus } from '@activepieces/shared'

const DEFAULT_BASE_URL = 'http://localhost:3000/api'
const POLL_INTERVAL_MS = 1_500
const DEFAULT_TURN_TIMEOUT_MS = 20 * 60 * 1_000
const TIMEOUT_STATUS = 'TIMEOUT'

// Thin client over the api-key-guarded chat eval endpoints. Drives one turn live
// (executeTools:true → tools run against the owner's real connections) and polls the
// conversation row until the turn settles, returning the persisted uiMessages.
function create({ baseUrl, apiKey }: { baseUrl?: string, apiKey: string }): EvalClient {
    const base = (baseUrl ?? process.env.AP_EVAL_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    const headers = { 'api-key': apiKey, 'Content-Type': 'application/json' }

    async function getSandboxPlatformId(): Promise<string> {
        const res = await fetch(`${base}/v1/chat/eval/sandbox-platform`, { headers })
        if (!res.ok) {
            throw new Error(`sandbox-platform failed: ${res.status} ${await res.text()}`)
        }
        const body = await res.json() as { platformId: string }
        return body.platformId
    }

    async function runTurn({ platformId, userMessage, mode, timeoutMs }: { platformId: string, userMessage: string, mode: RunMode, timeoutMs?: number }): Promise<TurnOutcome> {
        const startRes = await fetch(`${base}/v1/chat/eval/turn/start`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ platformId, userMessage, ...(mode === 'live' ? { executeTools: true } : { discoveryOnly: true }) }),
        })
        if (!startRes.ok) {
            throw new Error(`turn/start failed: ${startRes.status} ${await startRes.text()}`)
        }
        const { conversationId, runId, priorAssistantTurns } = await startRes.json() as { conversationId: string, runId: string, priorAssistantTurns: number }
        const settled = await pollState({ conversationId, priorAssistantTurns, timeoutMs: timeoutMs ?? DEFAULT_TURN_TIMEOUT_MS })
        return { conversationId, runId, status: settled.status, uiMessages: settled.uiMessages }
    }

    async function pollState({ conversationId, priorAssistantTurns, timeoutMs }: { conversationId: string, priorAssistantTurns: number, timeoutMs: number }): Promise<{ status: string, uiMessages: unknown[] }> {
        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
            await delay(POLL_INTERVAL_MS)
            const res = await fetch(`${base}/v1/chat/eval/conversations/${conversationId}/state`, { headers })
            if (!res.ok) continue
            const body = await res.json() as { status: ChatConversationStatus, uiMessages: unknown[] }
            const uiMessages = body.uiMessages ?? []
            if (body.status === ChatConversationStatus.ERROR) {
                return { status: body.status, uiMessages }
            }
            if (body.status === ChatConversationStatus.IDLE && countAssistantTurns(uiMessages) > priorAssistantTurns) {
                return { status: body.status, uiMessages }
            }
        }
        return { status: TIMEOUT_STATUS, uiMessages: [] }
    }

    return { getSandboxPlatformId, runTurn }
}

function countAssistantTurns(uiMessages: unknown[]): number {
    return uiMessages.filter((m) => typeof m === 'object' && m !== null && 'role' in m && (m as { role: unknown }).role === 'assistant').length
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export const evalClient = {
    create,
    TIMEOUT_STATUS,
}

export type TurnOutcome = {
    conversationId: string
    runId: string
    status: string
    uiMessages: unknown[]
}

export type RunMode = 'discovery' | 'live'

export type EvalClient = {
    getSandboxPlatformId: () => Promise<string>
    runTurn: (params: { platformId: string, userMessage: string, mode: RunMode, timeoutMs?: number }) => Promise<TurnOutcome>
}
