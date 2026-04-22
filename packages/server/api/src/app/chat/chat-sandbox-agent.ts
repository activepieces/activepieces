/**
 * All sandbox-agent imports are dynamic because the package is ESM-only
 * and this server uses CommonJS module resolution.
 */

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

type McpLocalConfig = {
    type: 'local'
    command: string
    args?: string[]
    env?: Record<string, string>
}

type SandboxAgentSdk = {
    createSession(request: { agent: string, sessionInit?: { cwd: string, mcpServers: unknown[] } }): Promise<SandboxSession>
    getEvents(request: { sessionId: string }): Promise<{ items: SessionEvent[] }>
    setMcpConfig(query: { directory: string, mcpName: string }, config: McpLocalConfig): Promise<void>
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
            const persist = new mod.InMemorySessionPersistDriver()
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

async function createSession({ anthropicApiKey, mcpServerUrl, mcpToken }: CreateSessionParams): Promise<SandboxSession> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })

    const session = await sdk.createSession({
        agent: 'claude',
        sessionInit: {
            cwd: process.cwd(),
            mcpServers: [],
        },
    })

    if (mcpServerUrl && mcpToken) {
        await registerMcpBridge(sdk, mcpServerUrl, mcpToken)
    }

    session.onPermissionRequest((request) => {
        void session.respondPermission(request.id, 'once')
    })

    return session
}

async function sendPrompt({ session, text }: SendPromptParams): Promise<void> {
    await session.prompt([{ type: 'text', text }])
}

async function destroySession({ sessionId, anthropicApiKey }: DestroySessionParams): Promise<void> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })
    await sdk.destroySession(sessionId)
}

async function getSessionHistory({ sessionId, anthropicApiKey }: ResumeSessionParams): Promise<Array<{ role: 'user' | 'assistant', content: string }>> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })
    const { items } = await sdk.getEvents({ sessionId })

    const messages: Array<{ role: 'user' | 'assistant', content: string }> = []
    let currentAssistantText = ''
    let inAssistantMessage = false

    for (const event of items) {
        const payload = event.payload
        if (event.sender === 'client' && payload.method === 'session/prompt') {
            if (inAssistantMessage && currentAssistantText) {
                messages.push({ role: 'assistant', content: currentAssistantText })
                currentAssistantText = ''
                inAssistantMessage = false
            }
            const text = payload.params?.prompt?.[0]?.text
            if (typeof text === 'string' && text.length > 0) {
                messages.push({ role: 'user', content: text })
            }
        }
        else if (event.sender === 'agent' && payload.method === 'session/update') {
            const update = payload.params?.update
            if (update?.sessionUpdate === 'agent_message_chunk' && typeof update.content?.text === 'string') {
                inAssistantMessage = true
                currentAssistantText += update.content.text
            }
        }
    }

    if (inAssistantMessage && currentAssistantText) {
        messages.push({ role: 'assistant', content: currentAssistantText })
    }

    return messages
}

async function registerMcpBridge(sdk: SandboxAgentSdk, mcpServerUrl: string, mcpToken: string): Promise<void> {
    const path = await import('path')
    const supergatewayBin = path.resolve(process.cwd(), 'packages/server/api/node_modules/.bin/supergateway')

    await sdk.setMcpConfig(
        { directory: process.cwd(), mcpName: 'activepieces' },
        {
            type: 'local',
            command: supergatewayBin,
            args: [
                '--streamableHttp', mcpServerUrl,
                '--oauth2Bearer', mcpToken,
            ],
        },
    )
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
    mcpServerUrl: string | null
    mcpToken: string | null
}

type SendPromptParams = {
    session: SandboxSession
    text: string
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
