import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isNil, parseToJsonIfPossible, tryCatch } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { GetAgentMemoryResponse } from '@activepieces/shared'
import { generateText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { agentHelpers } from './agent-helpers'

const MAX_INPUT_LENGTH = 50_000

function loadMemoryPrompt(filename: string): string {
    return readFileSync(path.resolve(`packages/server/api/src/assets/prompts/${filename}`), 'utf8')
}

const EXTRACTION_SYSTEM_PROMPT = loadMemoryPrompt('chat-memory-extraction-prompt.md')

const INSTRUCTION_SYSTEM_PROMPT = loadMemoryPrompt('chat-memory-instruction-prompt.md')

const ExtractionSchema = z.object({
    instructions: z.string().catch(''),
    memories: z.array(z.string().catch('')).catch([]),
})

const MemoriesSchema = z.object({
    memories: z.array(z.string().catch('')).catch([]),
})


function parseJsonObject<T>(raw: string, schema: z.ZodType<T>): T | null {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) {
        return null
    }
    const parsed = schema.safeParse(parseToJsonIfPossible(raw.slice(start, end + 1)))
    return parsed.success ? parsed.data : null
}

function naiveSplit(text: string): GetAgentMemoryResponse {
    const memories = text
        .split('\n')
        .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    return agentHelpers.capMemories({ instructions: null, memories })
}

async function runMemoryLlm<T>({ platformId, instructions, prompt, schema, log }: {
    platformId: string
    instructions: string
    prompt: string
    schema: z.ZodType<T>
    log: FastifyBaseLogger
}): Promise<T | null> {
    const { data, error } = await tryCatch(async () => {
        const { text: raw } = await generateText({ model: await agentHelpers.resolveFastModel({ platformId, log }), instructions, prompt, telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-memory' }) })
        return parseJsonObject(raw, schema)
    })
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, '[agentMemoryAi] LLM call failed')
        return null
    }
    return data
}

async function extract({ platformId, text, log }: {
    platformId: string
    text: string
    log: FastifyBaseLogger
}): Promise<GetAgentMemoryResponse> {
    const trimmed = text.trim().slice(0, MAX_INPUT_LENGTH)
    if (trimmed.length === 0) {
        return { instructions: null, memories: [] }
    }
    const parsed = await runMemoryLlm({ platformId, instructions: EXTRACTION_SYSTEM_PROMPT, prompt: trimmed, schema: ExtractionSchema, log })
    return isNil(parsed) ? naiveSplit(trimmed) : agentHelpers.capMemories(parsed)
}

async function applyInstruction({ platformId, userId, instruction, log }: {
    platformId: string
    userId: string
    instruction: string
    log: FastifyBaseLogger
}): Promise<GetAgentMemoryResponse> {
    const trimmed = instruction.trim().slice(0, MAX_INPUT_LENGTH)
    const current = await agentHelpers.getUserMemory({ platformId, userId })
    if (trimmed.length === 0) {
        return current
    }
    const currentList = current.memories.length > 0
        ? current.memories.map((memory) => `- ${memory}`).join('\n')
        : '(none yet)'
    const parsed = await runMemoryLlm({ platformId, instructions: INSTRUCTION_SYSTEM_PROMPT, prompt: `Current memories:\n${currentList}\n\nInput: ${trimmed}`, schema: MemoriesSchema, log })
    const nextMemories = isNil(parsed) ? [...current.memories, trimmed] : parsed.memories
    return agentHelpers.saveUserMemory({ platformId, userId, memories: nextMemories, baseMemories: current.memories })
}

export const agentMemoryAi = {
    extract,
    applyInstruction,
    naiveSplit,
    parseJsonObject,
    ExtractionSchema,
    MemoriesSchema,
}
