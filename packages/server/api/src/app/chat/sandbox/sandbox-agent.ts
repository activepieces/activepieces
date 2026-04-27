import {
    ActivepiecesError,
    apId,
    ChatHistoryMessage,
    ChatHistoryToolCall,
    ErrorCode,
    isObject,
    isString,
    tryCatch,
} from '@activepieces/shared'
import type { SandboxAgent, SandboxProvider, Session, SessionCreateRequest, SessionPersistDriver } from 'sandbox-agent'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { chatEventUtils } from './ai-event-utils'
import { chatSessionEvents } from './postgres-persist-driver'

const MAX_CONCURRENT_SANDBOXES = 20
const MAX_CACHED_ENTRIES = 50
const SLOT_WAIT_TIMEOUT_MS = 60_000
const SDK_TIMEOUT_MS = 30_000
const SDK_CACHE_TTL_MS = 10 * 60 * 1000
const SANDBOX_IDLE_TIMEOUT_MS = 5 * 60 * 1000
const E2B_TEMPLATE = 'wunszvjeuyrdgrt0z6o9'
let activeSandboxCount = 0
const slotQueue: Array<{ resolve: () => void, reject: (err: Error) => void }> = []
const sdkCache = new Map<string, { sdk: SandboxAgent, expiresAt: number }>()

async function acquireSandboxSlot(): Promise<void> {
    if (activeSandboxCount < MAX_CONCURRENT_SANDBOXES) {
        activeSandboxCount++
        return
    }
    return new Promise<void>((resolve, reject) => {
        const entry = { resolve, reject }
        slotQueue.push(entry)
        const timeoutId = setTimeout(() => {
            const idx = slotQueue.indexOf(entry)
            if (idx !== -1) {
                slotQueue.splice(idx, 1)
            }
            reject(new ActivepiecesError({
                code: ErrorCode.SANDBOX_CAPACITY_EXCEEDED,
                params: {},
            }))
        }, SLOT_WAIT_TIMEOUT_MS)
        const originalResolve = entry.resolve
        entry.resolve = () => {
            clearTimeout(timeoutId)
            activeSandboxCount++
            originalResolve()
        }
    })
}

function releaseSandboxSlot(): void {
    activeSandboxCount = Math.max(0, activeSandboxCount - 1)
    const next = slotQueue.shift()
    if (next) {
        next.resolve()
    }
}

async function startSdk({ sandbox, sandboxId, persist }: {
    sandbox: SandboxProvider
    sandboxId?: string
    persist: SessionPersistDriver
}): Promise<SandboxAgent> {
    const { SandboxAgent: SandboxAgentClass } = await esmImport<typeof import('sandbox-agent')>('sandbox-agent')
    const sdkPromise = SandboxAgentClass.start({ sandbox, sandboxId, persist })
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`E2B sandbox creation timed out after ${SDK_TIMEOUT_MS}ms`)), SDK_TIMEOUT_MS)
    })
    try {
        return await Promise.race([sdkPromise, timeout])
    }
    catch (err) {
        void sdkPromise.then((sdk) => sdk.destroySandbox().catch(() => undefined)).catch(() => undefined)
        throw err
    }
    finally {
        clearTimeout(timeoutId)
    }
}

async function createSdk({ aiConfig, sandboxId }: { aiConfig: ChatAiConfig, sandboxId?: string }): Promise<SandboxAgent> {
    const e2bApiKey = system.getOrThrow(AppSystemProp.E2B_API_KEY)
    const { e2b } = await esmImport<typeof import('sandbox-agent/e2b')>('sandbox-agent/e2b')
    const sandbox = e2b({
        create: { apiKey: e2bApiKey, envs: aiConfig.envs },
        connect: { apiKey: e2bApiKey },
        timeoutMs: SANDBOX_IDLE_TIMEOUT_MS,
        template: E2B_TEMPLATE,
    })
    const { PostgresSessionPersistDriver } = await import('./postgres-persist-driver')
    const persist = new PostgresSessionPersistDriver() as unknown as SessionPersistDriver

    if (sandboxId) {
        const { data: sdk } = await tryCatch(async () => startSdk({ sandbox, sandboxId, persist }))
        if (sdk) {
            return sdk
        }
    }
    return startSdk({ sandbox, persist })
}

async function createSandbox({ aiConfig }: { aiConfig: ChatAiConfig }): Promise<string> {
    const sdk = await createSdk({ aiConfig })
    const sandboxId = sdk.sandboxId
    if (!sandboxId) {
        await sdk.destroySandbox().catch(() => undefined)
        throw new Error('E2B sandbox created but returned no sandboxId')
    }
    await sdk.pauseSandbox().catch(() => undefined)
    return sandboxId
}

async function destroySandbox({ sandboxId, aiConfig }: { sandboxId: string, aiConfig: ChatAiConfig }): Promise<void> {
    const { data: sdk } = await tryCatch(async () => createSdk({ aiConfig, sandboxId }))
    if (sdk) {
        await sdk.killSandbox().catch(() => undefined)
    }
}

async function createSession({ aiConfig, sandboxId, mcpServerUrl, mcpToken }: CreateSessionParams): Promise<CreateSessionResult> {
    const sdk = await createSdk({ aiConfig, sandboxId })

    const request: SessionCreateRequest = {
        agent: aiConfig.agent,
        model: aiConfig.model,
        sessionInit: {
            cwd: '/tmp',
            mcpServers: mcpServerUrl && mcpToken
                ? [{
                    type: 'http',
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

    const resolvedSandboxId = sdk.sandboxId ?? sandboxId
    evictOldestSdkIfFull()
    sdkCache.set(resolvedSandboxId, { sdk, expiresAt: Date.now() + SDK_CACHE_TTL_MS })

    return { session, sdk }
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

function isPdfMimeType(mimeType: string): boolean {
    return mimeType === 'application/pdf'
}

function isSupportedMimeType(mimeType: string): boolean {
    return isTextMimeType(mimeType) || isPdfMimeType(mimeType) || isImageMimeType(mimeType)
}

async function extractPdfText(base64Data: string): Promise<string> {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const buffer = Buffer.from(base64Data, 'base64')
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    return text
}

async function sendPrompt({ session, text, systemPrompt, files }: SendPromptParams): Promise<void> {
    let userText = text
    const contentBlocks: Array<{ type: 'text', text: string } | { type: 'image', data: string, mimeType: string }> = []

    if (files && files.length > 0) {
        const textFiles = files.filter((f) => isTextMimeType(f.mimeType))
        const pdfFiles = files.filter((f) => isPdfMimeType(f.mimeType))
        const imageFiles = files.filter((f) => isImageMimeType(f.mimeType))
        const unsupportedFiles = files.filter((f) => !isSupportedMimeType(f.mimeType))

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

        if (pdfFiles.length > 0) {
            const fileDescriptions = pdfFiles.map((f) => `- ${f.name} (PDF)`).join('\n')
            userText += `\n\n[Attached PDF files — extracted text provided inline below]\n${fileDescriptions}`
            const pdfTexts = await Promise.all(pdfFiles.map((f) => extractPdfText(f.data)))
            for (let i = 0; i < pdfFiles.length; i++) {
                contentBlocks.push({
                    type: 'text',
                    text: `\n--- File: ${pdfFiles[i].name} ---\n${pdfTexts[i]}`,
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
            userText += `\n\n[Unsupported file types — skipped]\n${skippedNames}\nOnly text, PDF, and image files are currently supported.`
        }
    }

    const fullText = systemPrompt
        ? `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\nUser message: ${userText}`
        : userText

    contentBlocks.unshift({ type: 'text', text: fullText })
    await session.prompt(contentBlocks)
}

async function destroySession({ sessionId, sandboxId }: { sessionId: string, sandboxId: string }): Promise<void> {
    const cached = sdkCache.get(sandboxId)
    if (cached && cached.expiresAt > Date.now()) {
        await cached.sdk.destroySession(sessionId)
    }
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
                pushAssistantMessage({ messages, content: currentAssistantText, thoughts: currentThoughts, toolCalls: currentToolCalls })
                currentAssistantText = ''
                currentThoughts = ''
                currentToolCalls = []
                inAssistantMessage = false
            }
            const params = isObject(payload.params) ? payload.params : undefined
            const prompt = Array.isArray(params?.prompt) ? params.prompt : undefined
            const firstBlock = prompt && isObject(prompt[0]) ? prompt[0] : undefined
            const rawText = firstBlock && isString(firstBlock.text) ? firstBlock.text : undefined
            const text = rawText ? stripHistoryReplay(stripSystemInstructions(rawText)) : ''
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
        pushAssistantMessage({ messages, content: currentAssistantText, thoughts: currentThoughts, toolCalls: currentToolCalls })
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

function pushAssistantMessage({ messages, content, thoughts, toolCalls }: {
    messages: ChatHistoryMessage[]
    content: string
    thoughts: string
    toolCalls: ChatHistoryToolCall[]
}): void {
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

function evictStaleCacheEntries(): void {
    const now = Date.now()
    for (const [key, entry] of sdkCache) {
        if (entry.expiresAt <= now) {
            void entry.sdk.dispose().catch(() => undefined)
            sdkCache.delete(key)
        }
    }
}

function evictOldestSdkIfFull(): void {
    if (sdkCache.size < MAX_CACHED_ENTRIES) return
    const oldest = sdkCache.keys().next().value
    if (oldest !== undefined) {
        void sdkCache.get(oldest)?.sdk.dispose().catch(() => undefined)
        sdkCache.delete(oldest)
    }
}

async function getOrCreateSdk({ aiConfig, sandboxId }: { aiConfig: ChatAiConfig, sandboxId: string }): Promise<SandboxAgent> {
    const cached = sdkCache.get(sandboxId)
    if (cached && cached.expiresAt > Date.now()) {
        return cached.sdk
    }
    if (cached) {
        void cached.sdk.dispose().catch(() => undefined)
        sdkCache.delete(sandboxId)
    }
    evictStaleCacheEntries()
    const sdk = await createSdk({ aiConfig, sandboxId })
    const resolvedId = sdk.sandboxId ?? sandboxId
    evictOldestSdkIfFull()
    sdkCache.set(resolvedId, { sdk, expiresAt: Date.now() + SDK_CACHE_TTL_MS })
    return sdk
}

async function resumeSession({ sessionId, sandboxId, aiConfig }: ResumeSessionParams): Promise<ResumeSessionResult> {
    const sdk = await getOrCreateSdk({ aiConfig, sandboxId })
    const session = await sdk.resumeSession(sessionId)
    session.onPermissionRequest((req) => {
        void session.respondPermission(req.id, 'once').catch(() => undefined)
    })
    return { session, sdk, newSandboxId: sdk.sandboxId ?? null }
}

// sandbox-agent only exports ESM (no CJS). TypeScript compiles import() to require() which breaks it.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const rawImport = new Function('specifier', 'return import(specifier)')
function esmImport<T>(specifier: string): Promise<T> {
    return rawImport(specifier)
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
    aiConfig: ChatAiConfig
    sandboxId: string
    mcpServerUrl: string | null
    mcpToken: string | null
}

type CreateSessionResult = {
    session: Session
    sdk: SandboxAgent
}

type SendPromptParams = {
    session: Session
    text: string
    systemPrompt?: string
    files?: Array<{ name: string, mimeType: string, data: string }>
}

type ResumeSessionParams = {
    sessionId: string
    sandboxId: string
    aiConfig: ChatAiConfig
}

type ResumeSessionResult = {
    session: Session
    sdk: SandboxAgent
    newSandboxId: string | null
}

export const chatSandboxAgent = {
    createSession,
    createSandbox,
    destroySandbox,
    sendPrompt,
    destroySession,
    resumeSession,
    getSessionHistory,
    acquireSandboxSlot,
    releaseSandboxSlot,
}

export const ChatSandboxConfig = {
    agent: { CLAUDE: 'claude' },
    model: {
        DEFAULT: 'default',
        SONNET_1M: 'sonnet[1m]',
        OPUS_1M: 'opus[1m]',
        HAIKU: 'haiku',
    },
    envVar: { ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY', ANTHROPIC_BASE_URL: 'ANTHROPIC_BASE_URL' },
} as const

export type ChatAiConfig = {
    agent: string
    model: string
    envs: Record<string, string>
}
