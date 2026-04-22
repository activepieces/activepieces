/**
 * All sandbox-agent imports are dynamic because the package is ESM-only
 * and this server uses CommonJS module resolution.
 */
import type { ChatHistoryMessage, ChatHistoryToolCall } from '@activepieces/shared'

type SandboxSession = {
    id: string
    prompt(content: Array<{ type: string, text: string }>): Promise<unknown>
    onEvent(listener: (event: { sender: string, payload: unknown }) => void): () => void
    onPermissionRequest(listener: (request: { id: string }) => void): void
    respondPermission(id: string, reply: string): Promise<unknown>
}

type SessionEvent = {
    sender: string
    payload: {
        method?: string
        params?: {
            prompt?: Array<{ type: string, text: string }>
            update?: {
                sessionUpdate?: string
                content?: { type: string, text: string }
            }
            [key: string]: unknown
        }
        [key: string]: unknown
    }
}

type SandboxAgentSdk = {
    createSession(request: { agent: string, sessionInit?: { cwd: string, mcpServers: unknown[] } }): Promise<SandboxSession>
    getEvents(request: { sessionId: string }): Promise<{ items: SessionEvent[] }>
    destroySession(sessionId: string): Promise<unknown>
    destroySandbox(): Promise<void>
    resumeSession(sessionId: string): Promise<SandboxSession>
    dispose(): Promise<void>
}

let sdkInstance: SandboxAgentSdk | null = null
let initPromise: Promise<SandboxAgentSdk> | null = null

async function getOrCreateSdk({ anthropicApiKey }: { anthropicApiKey: string }): Promise<SandboxAgentSdk> {
    if (sdkInstance) {
        return sdkInstance
    }
    if (!initPromise) {
        initPromise = (async () => {
            const providerType = process.env.AP_SANDBOX_PROVIDER ?? 'local'
            let sandbox: unknown

            if (providerType === 'cloudflare') {
                const { cloudflare } = await import('sandbox-agent/cloudflare')
                const { Sandbox } = await import('@cloudflare/sandbox')
                sandbox = cloudflare({ sdk: new Sandbox() })
            }
            else {
                const { local } = await import('sandbox-agent/local')
                sandbox = local({
                    env: {
                        ANTHROPIC_API_KEY: anthropicApiKey,
                    },
                })
            }

            const mod = await import('sandbox-agent')
            const { FileSessionPersistDriver } = await import('./file-session-persist-driver')
            const persist = new FileSessionPersistDriver()
            const startFn = mod.SandboxAgent.start as (opts: { sandbox: unknown, persist: unknown }) => Promise<SandboxAgentSdk>
            sdkInstance = await startFn({ sandbox, persist })
            return sdkInstance
        })().catch((err: unknown) => {
            initPromise = null
            throw err
        })
    }
    return initPromise
}

async function createSession({ anthropicApiKey, mcpProjects }: CreateSessionParams): Promise<SandboxSession> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })

    const mcpServers: unknown[] = mcpProjects.map((p) => ({
        type: 'http',
        name: p.projectName || 'default-project',
        url: p.mcpServerUrl,
        headers: [{ name: 'Authorization', value: `Bearer ${p.mcpToken}` }],
    }))

    const session = await sdk.createSession({
        agent: 'claude',
        model: 'opus[1m]',
        mode: 'bypassPermissions',
        sessionInit: {
            cwd: process.cwd(),
            mcpServers,
        },
    })

    return session
}

async function sendPrompt({ session, text, systemPrompt }: SendPromptParams): Promise<void> {
    const fullText = systemPrompt
        ? `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\nUser message: ${text}`
        : text
    await session.prompt([{ type: 'text', text: fullText }])
}

async function destroySession({ sessionId, anthropicApiKey }: DestroySessionParams): Promise<void> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })
    await sdk.destroySession(sessionId)
}

async function getSessionHistory({ sessionId, anthropicApiKey }: ResumeSessionParams): Promise<ChatHistoryMessage[]> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })
    const { items } = await sdk.getEvents({ sessionId })

    const messages: ChatHistoryMessage[] = []
    let currentAssistantText = ''
    let currentThoughts = ''
    let currentToolCalls: ChatHistoryToolCall[] = []
    let inAssistantMessage = false

    for (const event of items) {
        const payload = event.payload
        if (event.sender === 'client' && payload.method === 'session/prompt') {
            if (inAssistantMessage) {
                pushAssistantMessage(messages, currentAssistantText, currentThoughts, currentToolCalls)
                currentAssistantText = ''
                currentThoughts = ''
                currentToolCalls = []
                inAssistantMessage = false
            }
            const rawText = payload.params?.prompt?.[0]?.text
            const text = typeof rawText === 'string' ? stripSystemInstructions(rawText) : ''
            if (text.length > 0) {
                messages.push({ role: 'user', content: text })
            }
        }
        else if (event.sender === 'agent' && payload.method === 'session/update') {
            const update = payload.params?.update as Record<string, unknown> | undefined
            if (!update) continue

            const updateType = update.sessionUpdate as string | undefined

            if (updateType === 'agent_message_chunk') {
                const content = update.content as Record<string, unknown> | undefined
                if (content && typeof content.text === 'string') {
                    inAssistantMessage = true
                    currentAssistantText += content.text
                }
            }
            else if (updateType === 'agent_thought_chunk') {
                const content = update.content as Record<string, unknown> | undefined
                if (content && typeof content.text === 'string') {
                    inAssistantMessage = true
                    currentThoughts += content.text
                }
            }
            else if (updateType === 'tool_call') {
                inAssistantMessage = true
                const toolCallId = typeof update.toolCallId === 'string' ? update.toolCallId : `tc-${Date.now()}`
                const title = typeof update.title === 'string' ? update.title : 'Unknown tool'
                const rawInput = typeof update.rawInput === 'object' && update.rawInput !== null && !Array.isArray(update.rawInput)
                    ? update.rawInput as Record<string, unknown>
                    : undefined
                currentToolCalls.push({ toolCallId, title, status: 'in_progress', input: rawInput })
            }
            else if (updateType === 'tool_call_update') {
                const toolCallId = typeof update.toolCallId === 'string' ? update.toolCallId : undefined
                if (toolCallId) {
                    const existing = currentToolCalls.find((tc) => tc.toolCallId === toolCallId)
                    if (existing) {
                        const status = typeof update.status === 'string' ? update.status : existing.status
                        existing.status = status
                        existing.output = extractHistoryToolOutput(update) ?? existing.output
                    }
                }
            }
        }
    }

    if (inAssistantMessage) {
        pushAssistantMessage(messages, currentAssistantText, currentThoughts, currentToolCalls)
    }

    return messages
}

function pushAssistantMessage(
    messages: ChatHistoryMessage[],
    content: string,
    thoughts: string,
    toolCalls: ChatHistoryToolCall[],
): void {
    if (!content && !thoughts && toolCalls.length === 0) return
    messages.push({
        role: 'assistant',
        content,
        ...(thoughts ? { thoughts } : {}),
        ...(toolCalls.length > 0 ? { toolCalls } : {}),
    })
}

function stripSystemInstructions(text: string): string {
    return text
        .replace(/<system_instructions>[\s\S]*?<\/system_instructions>\s*/g, '')
        .replace(/^User message:\s*/i, '')
        .trim()
}

function extractHistoryToolOutput(update: Record<string, unknown>): string | undefined {
    if (typeof update.rawOutput === 'string') return update.rawOutput
    if (Array.isArray(update.content)) {
        const parts: string[] = []
        for (const block of update.content) {
            if (typeof block === 'object' && block !== null && !Array.isArray(block)) {
                const b = block as Record<string, unknown>
                if (b.type === 'text' && typeof b.text === 'string') {
                    parts.push(b.text)
                }
            }
        }
        if (parts.length > 0) return parts.join('\n')
    }
    return undefined
}

async function resumeSession({ sessionId, anthropicApiKey }: ResumeSessionParams): Promise<SandboxSession> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })
    return sdk.resumeSession(sessionId)
}

async function dispose(): Promise<void> {
    if (sdkInstance) {
        await sdkInstance.destroySandbox()
        await sdkInstance.dispose()
        sdkInstance = null
        initPromise = null
    }
}

type CreateSessionParams = {
    anthropicApiKey: string
    mcpProjects: McpProjectConfig[]
}

export type McpProjectConfig = {
    projectName: string
    mcpServerUrl: string
    mcpToken: string
}

type SendPromptParams = {
    session: SandboxSession
    text: string
    systemPrompt?: string
}

type DestroySessionParams = {
    sessionId: string
    anthropicApiKey: string
}

type ResumeSessionParams = {
    sessionId: string
    anthropicApiKey: string
}

export const chatSandboxAgent = {
    createSession,
    sendPrompt,
    destroySession,
    resumeSession,
    getSessionHistory,
    dispose,
}
