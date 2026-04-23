/**
 * All sandbox-agent imports are dynamic because the package is ESM-only
 * and this server uses CommonJS module resolution.
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { type ChatHistoryMessage, type ChatHistoryToolCall } from '@activepieces/shared'

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

const sdksByKey = new Map<string, SandboxAgentSdk>()
const initPromises = new Map<string, Promise<SandboxAgentSdk>>()

async function getOrCreateSdk({ anthropicApiKey }: { anthropicApiKey: string }): Promise<SandboxAgentSdk> {
    const existing = sdksByKey.get(anthropicApiKey)
    if (existing) {
        return existing
    }
    const pending = initPromises.get(anthropicApiKey)
    if (pending) {
        return pending
    }
    const promise = (async () => {
        const providerType = process.env.AP_SANDBOX_PROVIDER ?? 'cloudflare'
        let sandbox: unknown

        if (providerType === 'local') {
            const { local } = await import('sandbox-agent/local')
            sandbox = local({
                env: {
                    ANTHROPIC_API_KEY: anthropicApiKey,
                },
            })
        }
        else {
            const { cloudflare } = await import('sandbox-agent/cloudflare')
            const { Sandbox } = await import('@cloudflare/sandbox')
            sandbox = cloudflare({ sdk: new Sandbox() })
        }

        const mod = await import('sandbox-agent')
        const { FileSessionPersistDriver } = await import('./file-session-persist-driver')
        const persist = new FileSessionPersistDriver()
        const startFn = mod.SandboxAgent.start as (opts: { sandbox: unknown, persist: unknown }) => Promise<SandboxAgentSdk>
        const sdk = await startFn({ sandbox, persist })
        sdksByKey.set(anthropicApiKey, sdk)
        return sdk
    })().catch((err: unknown) => {
        initPromises.delete(anthropicApiKey)
        throw err
    })
    initPromises.set(anthropicApiKey, promise)
    return promise
}

async function createSession({ anthropicApiKey, mcpServerUrl, mcpToken }: CreateSessionParams): Promise<SandboxSession> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })

    const mcpServers: unknown[] = []
    if (mcpServerUrl && mcpToken) {
        mcpServers.push({
            type: 'http',
            name: 'activepieces',
            url: mcpServerUrl,
            headers: [{ name: 'Authorization', value: `Bearer ${mcpToken}` }],
        })
    }

    const sandboxCwd = await fs.mkdtemp(path.join(os.tmpdir(), 'ap-sandbox-'))
    const session = await sdk.createSession({
        agent: 'claude',
        model: 'opus[1m]',
        sessionInit: {
            cwd: sandboxCwd,
            mcpServers,
        },
    })

    session.onPermissionRequest((request) => {
        void session.respondPermission(request.id, 'once')
    })

    return session
}

function isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/')
}

function sanitizeFileName(name: string): string {
    const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255)
    if (!base || base === '.' || base === '..') {
        return '_unnamed'
    }
    return base
}

async function writeFilesToDisk(files: Array<{ name: string, mimeType: string, data: string }>): Promise<{ dir: string, paths: string[] }> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ap-chat-'))
    const paths: string[] = []
    for (const file of files) {
        const safeName = sanitizeFileName(file.name)
        const filePath = path.join(dir, safeName)
        await fs.writeFile(filePath, Buffer.from(file.data, 'base64'))
        paths.push(filePath)
    }
    return { dir, paths }
}

async function sendPrompt({ session, text, systemPrompt, files }: SendPromptParams): Promise<void> {
    let userText = text
    const contentBlocks: Array<Record<string, unknown>> = []
    let tempDir: string | undefined

    try {
        if (files && files.length > 0) {
            const nonImageFiles = files.filter((f) => !isImageMimeType(f.mimeType))
            const imageFiles = files.filter((f) => isImageMimeType(f.mimeType))

            if (nonImageFiles.length > 0) {
                const result = await writeFilesToDisk(nonImageFiles)
                tempDir = result.dir
                const fileList = result.paths.map((p) => `- ${path.basename(p)}: ${p}`).join('\n')
                userText += `\n\n[Attached files saved to disk — read them with your tools]\n${fileList}`
            }

            for (const file of imageFiles) {
                contentBlocks.push({
                    type: 'image',
                    data: file.data,
                    mimeType: file.mimeType,
                })
            }
        }

        const fullText = systemPrompt
            ? `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\nUser message: ${userText}`
            : userText

        contentBlocks.unshift({ type: 'text', text: fullText })
        await session.prompt(contentBlocks as Array<{ type: string, text: string }>)
    }
    finally {
        if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
        }
    }
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

function isHistoryReplayDump(text: string): boolean {
    return text.includes('"jsonrpc"') && text.includes('"session/update"') && text.includes('"createdAt"')
}

function stripHistoryReplay(text: string): string {
    if (!isHistoryReplayDump(text)) {
        const marker = 'Previous session history is replayed below'
        const idx = text.indexOf(marker)
        if (idx === -1) return text
        return text.slice(0, idx).trim()
    }
    return ''
}

function pushAssistantMessage(
    messages: ChatHistoryMessage[],
    content: string,
    thoughts: string,
    toolCalls: ChatHistoryToolCall[],
): void {
    const cleaned = stripHistoryReplay(content)
    if (!cleaned && !thoughts && toolCalls.length === 0) return
    messages.push({
        role: 'assistant',
        content: cleaned,
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
    const instances = [...sdksByKey.values()]
    sdksByKey.clear()
    initPromises.clear()
    for (const sdk of instances) {
        await sdk.destroySandbox().catch(() => undefined)
        await sdk.dispose().catch(() => undefined)
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
    systemPrompt?: string
    files?: Array<{ name: string, mimeType: string, data: string }>
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
