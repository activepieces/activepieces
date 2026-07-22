import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { chatAiUtils } from '@activepieces/server-utils'
import { GetChatMemoryResponse } from '@activepieces/shared'
import { generateText, LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { chatHelpers } from './chat-helpers'

const MAX_INPUT_LENGTH = 50_000

const EXTRACTION_SYSTEM_PROMPT = `You convert a memory export from another AI assistant into two buckets for an automation copilot.
Return ONLY a JSON object (no prose, no code fences), shaped exactly:
{"instructions": string, "memories": string[]}
- "instructions": standing instructions about tone, persona, and how the user wants the assistant to work and talk. One short paragraph. Empty string if none.
- "memories": discrete durable facts, defaults, and corrections about the user — one short standalone statement per array item. Deduplicate. Omit one-off task details.`

const INSTRUCTION_SYSTEM_PROMPT = `You maintain a user's list of durable facts an AI assistant remembers about them. Given the current list and a new statement or instruction from the user, return the updated, reconciled list as JSON: {"memories": string[]}.
Rules:
- Integrate the new input as a short standalone fact in the user's own voice.
- If it updates, contradicts, or duplicates an existing item, REPLACE that item — never keep two facts that conflict or overlap (e.g. do not keep both "prefers pizza over burgers" and "prefers burgers over pizza").
- If the user asks to forget something, remove it.
- Leave unrelated items unchanged.
The final list must be internally consistent and free of duplicates. Return only the JSON object.`

const ExtractionSchema = z.object({
    instructions: z.string().catch(''),
    memories: z.array(z.string().catch('')).catch([]),
})

const MemoriesSchema = z.object({
    memories: z.array(z.string().catch('')).catch([]),
})

async function resolveModel(platformId: string, log: FastifyBaseLogger): Promise<LanguageModel> {
    const providerConfig = await chatHelpers.resolveChatProvider({ platformId, log })
    return chatAiUtils.createChatModel({
        provider: providerConfig.provider,
        auth: providerConfig.auth as Record<string, unknown>,
        config: providerConfig.config as Record<string, unknown>,
        modelId: chatHelpers.resolveFastModelId({ provider: providerConfig.provider }),
    })
}

function parseJsonObject<T>(raw: string, schema: z.ZodType<T>): T | null {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) {
        return null
    }
    const { data, error } = tryCatchSync<unknown>(() => JSON.parse(raw.slice(start, end + 1)))
    if (!isNil(error)) {
        return null
    }
    const parsed = schema.safeParse(data)
    return parsed.success ? parsed.data : null
}

function naiveSplit(text: string): GetChatMemoryResponse {
    const memories = text
        .split('\n')
        .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    return chatHelpers.capMemories({ instructions: null, memories })
}

async function runMemoryLlm<T>({ platformId, system, prompt, schema, log }: {
    platformId: string
    system: string
    prompt: string
    schema: z.ZodType<T>
    log: FastifyBaseLogger
}): Promise<T | null> {
    const { data, error } = await tryCatch(async () => {
        const { text: raw } = await generateText({ model: await resolveModel(platformId, log), system, prompt })
        return parseJsonObject(raw, schema)
    })
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, '[chatMemoryAi] LLM call failed')
        return null
    }
    return data
}

async function extract({ platformId, text, log }: {
    platformId: string
    text: string
    log: FastifyBaseLogger
}): Promise<GetChatMemoryResponse> {
    const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH)
    if (trimmed.length === 0) {
        return { instructions: null, memories: [] }
    }
    const parsed = await runMemoryLlm({ platformId, system: EXTRACTION_SYSTEM_PROMPT, prompt: trimmed, schema: ExtractionSchema, log })
    return isNil(parsed) ? naiveSplit(trimmed) : chatHelpers.capMemories(parsed)
}

async function applyInstruction({ platformId, userId, instruction, log }: {
    platformId: string
    userId: string
    instruction: string
    log: FastifyBaseLogger
}): Promise<GetChatMemoryResponse> {
    const trimmed = instruction.trim().slice(0, MAX_INPUT_LENGTH)
    const current = await chatHelpers.getUserChatMemory({ platformId, userId })
    if (trimmed.length === 0) {
        return current
    }
    const currentList = current.memories.length > 0
        ? current.memories.map((memory) => `- ${memory}`).join('\n')
        : '(none yet)'
    const parsed = await runMemoryLlm({ platformId, system: INSTRUCTION_SYSTEM_PROMPT, prompt: `Current memories:\n${currentList}\n\nInput: ${trimmed}`, schema: MemoriesSchema, log })
    const nextMemories = isNil(parsed) ? [...current.memories, trimmed] : parsed.memories
    return chatHelpers.saveUserChatMemory({ platformId, userId, memories: nextMemories })
}

export const chatMemoryAi = {
    extract,
    applyInstruction,
    naiveSplit,
    parseJsonObject,
    ExtractionSchema,
    MemoriesSchema,
}
