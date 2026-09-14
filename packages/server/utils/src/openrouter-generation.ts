import { isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { z } from 'zod'
import { safeHttp } from './safe-http'

export async function lookupGeneration({ apiKey, generationId }: LookupGenerationParams): Promise<Generation | undefined> {
    const { data: response, error } = await tryCatch(() => safeHttp.axios.get<unknown>(GENERATION_URL, {
        params: { id: generationId },
        timeout: LOOKUP_TIMEOUT_MS,
        headers: { Authorization: `Bearer ${apiKey}` },
    }))
    if (!isNil(error) || isNil(response)) {
        return undefined
    }
    const parsed = GenerationResponse.safeParse(response.data)
    return parsed.success ? generationOf(parsed.data.data) : undefined
}

function generationOf(data: GenerationData): Generation {
    return {
        costUsd: data.total_cost,
        ...spreadIfDefined('inputTokens', data.native_tokens_prompt ?? data.tokens_prompt ?? undefined),
        ...spreadIfDefined('outputTokens', data.native_tokens_completion ?? data.tokens_completion ?? undefined),
    }
}

const GENERATION_URL = 'https://openrouter.ai/api/v1/generation'
const LOOKUP_TIMEOUT_MS = 10_000

const GenerationData = z.object({
    total_cost: z.number(),
    tokens_prompt: z.number().nullish(),
    tokens_completion: z.number().nullish(),
    native_tokens_prompt: z.number().nullish(),
    native_tokens_completion: z.number().nullish(),
})

const GenerationResponse = z.object({
    data: GenerationData,
})

export type LookupGenerationParams = {
    apiKey: string
    generationId: string
}

export type Generation = {
    costUsd: number
    inputTokens?: number
    outputTokens?: number
}

type GenerationData = z.infer<typeof GenerationData>
