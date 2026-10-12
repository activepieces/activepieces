import { isNil, tryCatch } from '@activepieces/core-utils'
import { ModelTierSurface } from '@activepieces/server-utils'
import { AiProviderToolChoices, AiProviderToolConfig, AIProviderWithoutSensitiveData, GetProviderConfigResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService, ProviderScope } from '../../../ai/ai-provider-service'
import { agentHelpers } from '../agent-helpers'

async function resolveForRun({ platformId, choices, surface, scope, log }: { platformId: string, choices: AiProviderToolChoices, surface: ModelTierSurface, scope: ProviderScope, log: FastifyBaseLogger }): Promise<ChosenProviders> {
    if (isNil(choices.webSearch) && isNil(choices.imageGeneration)) {
        return { search: null, image: null }
    }
    const configs = await aiProviderService(log).listConfigs(platformId)
    const [search, image] = await Promise.all([
        keyCredentialsForRun({ platformId, configs, choice: choices.webSearch, scope, log }).then((credentials) => searchKeyWithFastModel({ platformId, credentials, surface, scope, log })),
        keyCredentialsForRun({ platformId, configs, choice: choices.imageGeneration, scope, log }).then((credentials) => imageKeyIfModelAllowed({ credentials, modelId: choices.imageGeneration?.modelId, log })),
    ])
    return { search, image }
}

async function keyCredentialsForRun({ platformId, configs, choice, scope, log }: { platformId: string, configs: AIProviderWithoutSensitiveData[], choice: AiProviderToolConfig | undefined, scope: ProviderScope, log: FastifyBaseLogger }): Promise<GetProviderConfigResponse | null> {
    const row = isNil(choice) ? undefined : configs.find((config) => config.id === choice.aiProviderId)
    if (isNil(row)) {
        return null
    }
    const { data, error } = await tryCatch(() => aiProviderService(log).getConfigOrThrow({ platformId, provider: row.provider, scope, configId: row.id }))
    if (error) {
        log.warn({ error, aiProvider: { id: row.id } }, '[chosenProviders#resolveForRun] Chosen AI provider cannot serve this run, using the chat provider')
    }
    return data ?? null
}

async function searchKeyWithFastModel({ platformId, credentials, surface, scope, log }: { platformId: string, credentials: GetProviderConfigResponse | null, surface: ModelTierSurface, scope: ProviderScope, log: FastifyBaseLogger }): Promise<ChosenProvider | null> {
    if (isNil(credentials)) {
        return null
    }
    const { data: modelId, error } = await tryCatch(() => agentHelpers.resolveFastModelId({ platformId, providerConfig: credentials, surface, scope, log }))
    if (error) {
        log.warn({ error, aiProvider: { id: credentials.configId } }, '[chosenProviders#resolveForRun] Chosen search provider has no usable model, using the chat provider')
        return null
    }
    return { credentials, modelId }
}

function imageKeyIfModelAllowed({ credentials, modelId, log }: { credentials: GetProviderConfigResponse | null, modelId: string | undefined, log: FastifyBaseLogger }): ChosenProvider | null {
    if (isNil(credentials) || isNil(modelId)) {
        return null
    }
    const modelAllowed = credentials.modelScope !== 'selected' || credentials.modelIds.includes(modelId)
    if (!modelAllowed) {
        log.warn({ aiProvider: { id: credentials.configId } }, '[chosenProviders#resolveForRun] Chosen image model is no longer allowed on its key, using the chat provider')
        return null
    }
    return { credentials, modelId }
}

export const chosenProviders = {
    resolveForRun,
}

type ChosenProvider = {
    credentials: GetProviderConfigResponse
    modelId: string
}

type ChosenProviders = {
    search: ChosenProvider | null
    image: ChosenProvider | null
}
