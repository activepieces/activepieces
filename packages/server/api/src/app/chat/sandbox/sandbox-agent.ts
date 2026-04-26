import {
    apId,
    ChatHistoryMessage,
    ChatHistoryToolCall,
    isObject,
    isString,
} from '@activepieces/shared'
import type { SandboxAgent, Session, SessionCreateRequest, SessionPersistDriver } from 'sandbox-agent'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { chatEventUtils } from './ai-event-utils'
import { chatSessionEvents } from './postgres-persist-driver'

const MAX_CONCURRENT_SANDBOXES = 20
const SDK_TIMEOUT_MS = 30_000
let activeSandboxCount = 0
const sandboxQueue: Array<{ resolve: () => void }> = []

async function acquireSandboxSlot(): Promise<void> {
    if (activeSandboxCount < MAX_CONCURRENT_SANDBOXES) {
        activeSandboxCount++
        return
    }
    return new Promise<void>((resolve) => {
        sandboxQueue.push({ resolve })
    })
}

function releaseSandboxSlot(): void {
    const next = sandboxQueue.shift()
    if (next) {
        next.resolve()
    }
    else {
        activeSandboxCount = Math.max(0, activeSandboxCount - 1)
    }
}

async function createSdk({ aiConfig }: { aiConfig: ChatAiConfig }): Promise<SandboxAgent> {
    await acquireSandboxSlot()
    try {
        const e2bApiKey = system.getOrThrow(AppSystemProp.E2B_API_KEY)
        const { e2b } = await esmImport<typeof import('sandbox-agent/e2b')>('sandbox-agent/e2b')
        const sandbox = e2b({
            create: { apiKey: e2bApiKey, envs: aiConfig.envs },
            connect: { apiKey: e2bApiKey },
        })
        const { SandboxAgent: SandboxAgentClass } = await esmImport<typeof import('sandbox-agent')>('sandbox-agent')
        const { PostgresSessionPersistDriver } = await import('./postgres-persist-driver')

        const sdkPromise = SandboxAgentClass.start({
            sandbox,
            persist: new PostgresSessionPersistDriver() as unknown as SessionPersistDriver,
        })
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        const timeout = new Promise<never>((_resolve, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`E2B sandbox creation timed out after ${SDK_TIMEOUT_MS}ms`)), SDK_TIMEOUT_MS)
        })
        try {
            return await Promise.race([sdkPromise, timeout])
        }
        catch (err) {
            // If timeout won, the SDK may still finish — destroy the orphaned sandbox
            void sdkPromise.then((sdk) => sdk.destroySandbox().catch(() => undefined))
            throw err
        }
        finally {
            clearTimeout(timeoutId)
        }
    }
    finally {
        releaseSandboxSlot()
    }
}

async function createSession({ aiConfig, mcpServerUrl, mcpToken }: CreateSessionParams): Promise<Session> {
    const sdk = await createSdk({ aiConfig })

    const request: SessionCreateRequest = {
        agent: aiConfig.agent,
        model: aiConfig.model,
        sessionInit: {
            cwd: '/tmp',
            mcpServers: mcpServerUrl && mcpToken
                ? [{
                    type: 'http' as const,
                    name: 'activepieces',
                    url: mcpServerUrl,
                    headers: [
                        { name: 'Authorization', value: `Bearer ${mcpToken}` },
                        { name: 'ngrok-skip-browser-warning', value: 'true' },
                    ],
                }]
                : [],
        },
    }

    const session = await sdk.createSession(request)

    session.onPermissionRequest((req) => {
        void session.respondPermission(req.id, 'once').catch(() => undefined)
    })

    return session
}

function isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/')
}

const TEXT_MIME_TYPES = new Set([
    'text/plain', 'text/csv', 'text/markdown',
    'application/json',
])

function isTextMimeType(mimeType: string): boolean {
    return TEXT_MIME_TYPES.has(mimeType)
}

async function sendPrompt({ session, text, systemPrompt, files }: SendPromptParams): Promise<void> {
    let userText = text
    const contentBlocks: Array<{ type: 'text', text: string } | { type: 'image', data: string, mimeType: string }> = []

    if (files && files.length > 0) {
        const textFiles = files.filter((f) => isTextMimeType(f.mimeType))
        const imageFiles = files.filter((f) => isImageMimeType(f.mimeType))
        const unsupportedFiles = files.filter((f) => !isTextMimeType(f.mimeType) && !isImageMimeType(f.mimeType))

        if (textFiles.length > 0) {
            const fileDescriptions = textFiles.map((f) => `- ${f.name} (${f.mimeType})`).join('\n')
            userText += `\n\n[Attached files — content provided inline below]\n${fileDescriptions}`
            for (const file of textFiles) {
                contentBlocks.push({
                    type: 'text',
                    text: `\n--- File: ${file.name} ---\n${Buffer.from(file.data, 'base64').toString('utf-8')}`,
                })
            }
        }

        for (const file of imageFiles) {
            contentBlocks.push({
                type: 'image',
                data: file.data,
                mimeType: file.mimeType,
            })
        }

        if (unsupportedFiles.length > 0) {
            const skippedNames = unsupportedFiles.map((f) => `- ${f.name} (${f.mimeType})`).join('\n')
            userText += `\n\n[Unsupported file types — skipped]\n${skippedNames}\nOnly text (plain, CSV, Markdown, JSON) and image files are currently supported.`
        }
    }

    const fullText = systemPrompt
        ? `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\nUser message: ${userText}`
        : userText

    contentBlocks.unshift({ type: 'text', text: fullText })
    await session.prompt(contentBlocks)
}

async function destroySession({ sessionId, aiConfig }: DestroySessionParams): Promise<void> {
    const sdk = await createSdk({ aiConfig })
    await sdk.destroySession(sessionId)
}

async function getSessionHistory({ sessionId }: { sessionId: string }): Promise<ChatHistoryMessage[]> {
    const messages: ChatHistoryMessage[] = []
    let currentAssistantText = ''
    let currentThoughts = ''
    let currentToolCalls: ChatHistoryToolCall[] = []
    let inAssistantMessage = false

    for await (const event of chatSessionEvents.streamEvents({ sessionId })) {
        const payload = event.payload

        if (event.sender === 'client' && payload.method === 'session/prompt') {
            if (inAssistantMessage) {
                pushAssistantMessage(messages, currentAssistantText, currentThoughts, currentToolCalls)
                currentAssistantText = ''
                currentThoughts = ''
                currentToolCalls = []
                inAssistantMessage = false
            }
            const params = isObject(payload.params) ? payload.params : undefined
            const prompt = Array.isArray(params?.prompt) ? params.prompt : undefined
            const firstBlock = prompt && isObject(prompt[0]) ? prompt[0] : undefined
            const rawText = firstBlock && isString(firstBlock.text) ? firstBlock.text : undefined
            const text = rawText ? stripSystemInstructions(rawText) : ''
            if (text.length > 0) {
                messages.push({ role: 'user', content: text })
            }
        }
        else if (event.sender === 'agent' && payload.method === 'session/update') {
            const params = isObject(payload.params) ? payload.params : undefined
            const update = isObject(params?.update) ? params.update : undefined
            if (!update) continue

            const updateType = isString(update.sessionUpdate) ? update.sessionUpdate : undefined

            if (updateType === SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK) {
                const content = isObject(update.content) ? update.content : undefined
                if (content && isString(content.text)) {
                    inAssistantMessage = true
                    currentAssistantText += content.text
                }
            }
            else if (updateType === SandboxSessionUpdateType.AGENT_THOUGHT_CHUNK) {
                const content = isObject(update.content) ? update.content : undefined
                if (content && isString(content.text)) {
                    inAssistantMessage = true
                    currentThoughts += content.text
                }
            }
            else if (updateType === SandboxSessionUpdateType.TOOL_CALL) {
                inAssistantMessage = true
                const toolCallId = isString(update.toolCallId) ? update.toolCallId : apId()
                const title = isString(update.title) ? update.title : 'Unknown tool'
                const rawInput = isObject(update.rawInput) ? update.rawInput : undefined
                currentToolCalls.push({ toolCallId, title, status: 'in_progress', input: rawInput })
            }
            else if (updateType === SandboxSessionUpdateType.TOOL_CALL_UPDATE) {
                const toolCallId = isString(update.toolCallId) ? update.toolCallId : undefined
                if (toolCallId) {
                    const existing = currentToolCalls.find((tc) => tc.toolCallId === toolCallId)
                    if (existing) {
                        const status = isString(update.status) ? update.status : existing.status
                        existing.status = status
                        existing.output = chatEventUtils.extractToolOutput(update) ?? existing.output
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

function stripHistoryReplay(text: string): string {
    if (chatEventUtils.isHistoryReplayContent(text)) {
        return ''
    }
    const marker = 'Previous session history is replayed below'
    const idx = text.indexOf(marker)
    if (idx !== -1) {
        return text.slice(0, idx).trim()
    }
    const jsonRpcStart = text.indexOf('{"createdAt":')
    if (jsonRpcStart > 0) {
        return text.slice(0, jsonRpcStart).trim()
    }
    return text
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

async function resumeSession({ sessionId, aiConfig }: SessionParams): Promise<Session> {
    const sdk = await createSdk({ aiConfig })
    const session = await sdk.resumeSession(sessionId)
    session.onPermissionRequest((req) => {
        void session.respondPermission(req.id, 'once').catch(() => undefined)
    })
    return session
}

// sandbox-agent only exports ESM (no CJS). TypeScript compiles import() to require() which breaks it.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const esmImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>

export const SandboxSessionUpdateType = {
    AGENT_MESSAGE_CHUNK: 'agent_message_chunk',
    AGENT_THOUGHT_CHUNK: 'agent_thought_chunk',
    TOOL_CALL: 'tool_call',
    TOOL_CALL_UPDATE: 'tool_call_update',
    PLAN: 'plan',
    SESSION_INFO_UPDATE: 'session_info_update',
    USAGE_UPDATE: 'usage_update',
} as const

type CreateSessionParams = {
    aiConfig: ChatAiConfig
    mcpServerUrl: string | null
    mcpToken: string | null
}

type SendPromptParams = {
    session: Session
    text: string
    systemPrompt?: string
    files?: Array<{ name: string, mimeType: string, data: string }>
}

type DestroySessionParams = {
    sessionId: string
    aiConfig: ChatAiConfig
}

type SessionParams = {
    sessionId: string
    aiConfig: ChatAiConfig
}

export const chatSandboxAgent = {
    createSession,
    sendPrompt,
    destroySession,
    resumeSession,
    getSessionHistory,
}

export const ChatSandboxConfig = {
    agent: { CLAUDE: 'claude' },
    model: { DEFAULT: 'default' },
    envVar: { ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY', ANTHROPIC_BASE_URL: 'ANTHROPIC_BASE_URL' },
} as const

export type ChatAiConfig = {
    agent: string
    model: string
    envs: Record<string, string>
}
