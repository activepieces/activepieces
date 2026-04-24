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

const sdkCache = new Map<string, SandboxAgent>()
const sdkPending = new Map<string, Promise<SandboxAgent>>()

async function getOrCreateSdk({ anthropicApiKey }: { anthropicApiKey: string }): Promise<SandboxAgent> {
    const cached = sdkCache.get(anthropicApiKey)
    if (cached) return cached
    const pending = sdkPending.get(anthropicApiKey)
    if (pending) return pending

    const e2bApiKey = system.getOrThrow(AppSystemProp.E2B_API_KEY)
    const promise = (async () => {
        const sandboxAgentPath = require.resolve('sandbox-agent').replace(/dist\/index\.js$/, '')
        const { e2b } = await import(sandboxAgentPath + 'dist/providers/e2b.js')
        const sandbox = e2b({
            create: {
                apiKey: e2bApiKey,
                envs: { ANTHROPIC_API_KEY: anthropicApiKey },
            },
            connect: { apiKey: e2bApiKey },
        })

        const { SandboxAgent: SandboxAgentClass } = await import('sandbox-agent')
        const { PostgresSessionPersistDriver } = await import('./postgres-persist-driver')
        const persist = new PostgresSessionPersistDriver()
        const agent = await SandboxAgentClass.start({ sandbox, persist: persist as unknown as SessionPersistDriver })
        sdkCache.set(anthropicApiKey, agent)
        sdkPending.delete(anthropicApiKey)
        return agent
    })().catch((err: unknown) => {
        sdkPending.delete(anthropicApiKey)
        throw err
    })
    sdkPending.set(anthropicApiKey, promise)
    return promise
}

async function createSession({ anthropicApiKey, mcpServerUrl, mcpToken }: CreateSessionParams): Promise<Session> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })

    const request: SessionCreateRequest = {
        agent: 'claude',
        model: 'opus[1m]',
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
        void session.respondPermission(req.id, 'once')
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
    }

    const fullText = systemPrompt
        ? `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\nUser message: ${userText}`
        : userText

    contentBlocks.unshift({ type: 'text', text: fullText })
    await session.prompt(contentBlocks)
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
        const raw: unknown = event.payload
        if (!isObject(raw)) continue
        const payload = raw

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

async function resumeSession({ sessionId, anthropicApiKey }: ResumeSessionParams): Promise<Session> {
    const sdk = await getOrCreateSdk({ anthropicApiKey })
    return sdk.resumeSession(sessionId)
}

async function dispose(): Promise<void> {
    for (const sdk of sdkCache.values()) {
        await sdk.destroySandbox().catch(() => undefined)
        await sdk.dispose().catch(() => undefined)
    }
    sdkCache.clear()
    sdkPending.clear()
}

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
    anthropicApiKey: string
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
    anthropicApiKey: string
}

type ResumeSessionParams = {
    sessionId: string
    anthropicApiKey: string
}

async function warmSdk({ anthropicApiKey }: { anthropicApiKey: string }): Promise<void> {
    await getOrCreateSdk({ anthropicApiKey })
}

export const chatSandboxAgent = {
    createSession,
    sendPrompt,
    destroySession,
    resumeSession,
    getSessionHistory,
    warmSdk,
    dispose,
}
