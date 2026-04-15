import { AIProviderAuthConfig, AIProviderName, tryCatch } from '@activepieces/shared'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../ai/ai-provider-service'

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'
const OPENROUTER_ANTHROPIC_MODEL = 'anthropic/claude-haiku-4-5-20251001'
const OPENAI_MODEL = 'gpt-4o-mini'
const GOOGLE_MODEL = 'gemini-2.0-flash'

export type CopilotModelResult = {
    model: LanguageModel
    provider: AIProviderName
}

export const createPlatformCopilotModel = async ({ platformId, log, modelId, provider }: CreateModelParams): Promise<CopilotModelResult> => {
    if (modelId !== undefined && provider !== undefined) {
        const specific = await tryCreateSpecificModel({ platformId, log, provider, modelId })
        if (specific !== null) {
            return specific
        }
    }

    const { data: anthropicConfig, error: anthropicError } = await tryCatch(() =>
        aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.ANTHROPIC }),
    )
    if (!anthropicError && anthropicConfig) {
        const auth = anthropicConfig.auth as AIProviderAuthConfig & { apiKey: string }
        return {
            model: createAnthropic({ apiKey: auth.apiKey })(ANTHROPIC_MODEL),
            provider: AIProviderName.ANTHROPIC,
        }
    }

    const { data: activepiecesAuth, error: activepiecesError } = await tryCatch(() =>
        aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId),
    )
    if (!activepiecesError && activepiecesAuth?.apiKey) {
        return {
            model: createOpenRouter({ apiKey: activepiecesAuth.apiKey }).chat(OPENROUTER_ANTHROPIC_MODEL) as LanguageModel,
            provider: AIProviderName.ACTIVEPIECES,
        }
    }

    const { data: openaiConfig, error: openaiError } = await tryCatch(() =>
        aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.OPENAI }),
    )
    if (!openaiError && openaiConfig) {
        const auth = openaiConfig.auth as AIProviderAuthConfig & { apiKey: string }
        return {
            model: createOpenAI({ apiKey: auth.apiKey }).chat(OPENAI_MODEL),
            provider: AIProviderName.OPENAI,
        }
    }

    const { data: googleConfig, error: googleError } = await tryCatch(() =>
        aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.GOOGLE }),
    )
    if (!googleError && googleConfig) {
        const auth = googleConfig.auth as AIProviderAuthConfig & { apiKey: string }
        return {
            model: createGoogleGenerativeAI({ apiKey: auth.apiKey })(GOOGLE_MODEL),
            provider: AIProviderName.GOOGLE,
        }
    }

    throw new Error('No AI provider configured. Please configure an AI provider in Platform Admin → AI Providers.')
}

async function tryCreateSpecificModel({ platformId, log, provider, modelId }: TryCreateSpecificModelParams): Promise<CopilotModelResult | null> {
    const providerName = Object.values(AIProviderName).find((v) => v === provider)
    if (providerName === undefined) {
        return null
    }

    if (providerName === AIProviderName.ANTHROPIC) {
        const { data: config, error } = await tryCatch(() =>
            aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.ANTHROPIC }),
        )
        if (error || !config) {
            return null
        }
        const auth = config.auth as AIProviderAuthConfig & { apiKey: string }
        return {
            model: createAnthropic({ apiKey: auth.apiKey })(modelId),
            provider: AIProviderName.ANTHROPIC,
        }
    }

    if (providerName === AIProviderName.ACTIVEPIECES) {
        const { data: activepiecesAuth, error } = await tryCatch(() =>
            aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId),
        )
        if (error || !activepiecesAuth?.apiKey) {
            return null
        }
        return {
            model: createOpenRouter({ apiKey: activepiecesAuth.apiKey }).chat(modelId) as LanguageModel,
            provider: AIProviderName.ACTIVEPIECES,
        }
    }

    if (providerName === AIProviderName.OPENAI) {
        const { data: config, error } = await tryCatch(() =>
            aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.OPENAI }),
        )
        if (error || !config) {
            return null
        }
        const auth = config.auth as AIProviderAuthConfig & { apiKey: string }
        return {
            model: createOpenAI({ apiKey: auth.apiKey }).chat(modelId),
            provider: AIProviderName.OPENAI,
        }
    }

    if (providerName === AIProviderName.GOOGLE) {
        const { data: config, error } = await tryCatch(() =>
            aiProviderService(log).getConfigOrThrow({ platformId, provider: AIProviderName.GOOGLE }),
        )
        if (error || !config) {
            return null
        }
        const auth = config.auth as AIProviderAuthConfig & { apiKey: string }
        return {
            model: createGoogleGenerativeAI({ apiKey: auth.apiKey })(modelId),
            provider: AIProviderName.GOOGLE,
        }
    }

    return null
}

type CreateModelParams = {
    platformId: string
    log: FastifyBaseLogger
    modelId?: string
    provider?: string
}

type TryCreateSpecificModelParams = {
    platformId: string
    log: FastifyBaseLogger
    provider: string
    modelId: string
}
