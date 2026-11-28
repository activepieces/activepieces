import { litellmAuth } from '@activepieces/ai-providers'
import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, AIProviderModelType, aiProviderUtils, ErrorCode, isNil, OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig, ProviderModelConfig, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { z } from 'zod'
import { MODEL_LIST_TIMEOUT_MS, ModelSyncMode } from './ai-provider'

async function syncModels({ authConfig, config, mode }: {
    authConfig: OpenAICompatibleProviderAuthConfig
    config: OpenAICompatibleProviderConfig
    mode: ModelSyncMode
}): Promise<OpenAICompatibleProviderConfig> {
    const discovery = await discover({ authConfig, config })
    if (discovery.status !== 'ok') {
        const savesTypedModels = mode === 'save' && discovery.status !== 'bad_key' && config.models.length > 0
        if (!savesTypedModels) {
            throw discoveryError({ discovery, config })
        }
        return config
    }
    const models = mergeModels({ sent: config.models, discovered: discovery.models })
    if (models.length === 0) {
        throw validationError(NO_MODELS_MESSAGE)
    }
    return { ...config, models }
}

function mergeModels({ sent, discovered }: { sent: ProviderModelConfig[], discovered: ProviderModelConfig[] }): ProviderModelConfig[] {
    const manual = sent.filter((model) => model.discovered !== true)
    const manualIds = new Set(manual.map((model) => model.modelId))
    return [...manual, ...discovered.filter((model) => !manualIds.has(model.modelId))]
}

function fromModelInfo({ rows }: { rows: unknown[] }): ProviderModelConfig[] {
    const models = rows.flatMap((row) => {
        const parsed = ModelInfoRow.safeParse(row)
        if (!parsed.success || parsed.data.model_name.includes('*')) {
            return []
        }
        const info = parsed.data.model_info
        const type = typeOfMode({ mode: info?.mode })
        if (isNil(type)) {
            return []
        }
        const metadata = toMetadata({ info, routedModel: parsed.data.litellm_params?.model })
        return [{
            modelId: parsed.data.model_name,
            modelName: parsed.data.model_name,
            modelType: type,
            discovered: true,
            ...(isNil(metadata) ? {} : { metadata }),
        }]
    })
    return firstPerId({ models })
}

function fromModelIds({ ids }: { ids: string[] }): ProviderModelConfig[] {
    const models = ids
        .filter((id) => !id.includes('*') && aiProviderUtils.isChatModelId({ modelId: id }))
        .map((id) => ({ modelId: id, modelName: id, modelType: AIProviderModelType.TEXT, discovered: true }))
    return firstPerId({ models })
}

function proxyRoot({ baseUrl }: { baseUrl: string }): string {
    let end = baseUrl.length
    while (end > 0 && baseUrl[end - 1] === '/') {
        end--
    }
    const trimmed = baseUrl.slice(0, end)
    return trimmed.endsWith(OPENAI_PATH) ? trimmed.slice(0, -OPENAI_PATH.length) : trimmed
}

async function discover({ authConfig, config }: { authConfig: OpenAICompatibleProviderAuthConfig, config: OpenAICompatibleProviderConfig }): Promise<Discovery> {
    const headers = litellmAuth.buildHeaders({ apiKeyHeader: config.apiKeyHeader, apiKey: authConfig.apiKey, defaultHeaders: config.defaultHeaders })
    const root = proxyRoot({ baseUrl: config.baseUrl })
    const info = await getJson({ url: `${root}${OPENAI_PATH}/model/info`, headers })
    if (info.status === 'ok') {
        const parsed = ListResponse.safeParse(info.body)
        if (parsed.success) {
            return { status: 'ok', models: sanitizeObjectForPostgresql(fromModelInfo({ rows: parsed.data.data })) }
        }
    }
    else if (info.status !== 'http_error') {
        return info
    }
    const list = await getJson({ url: `${root}${OPENAI_PATH}/models`, headers })
    if (list.status === 'http_error') {
        return { status: 'unreachable', detail: list.detail }
    }
    if (list.status !== 'ok') {
        return list
    }
    const parsed = ModelIdsResponse.safeParse(list.body)
    if (!parsed.success) {
        return { status: 'unreachable', detail: 'the model list is not in the OpenAI format' }
    }
    return { status: 'ok', models: sanitizeObjectForPostgresql(fromModelIds({ ids: parsed.data.data.map((model) => model.id) })) }
}

async function getJson({ url, headers }: { url: string, headers: Record<string, string> }): Promise<JsonResult> {
    const { data: response, error } = await tryCatch(() => safeHttp.axios.request<unknown>({
        method: 'GET',
        url,
        headers,
        timeout: MODEL_LIST_TIMEOUT_MS,
        signal: AbortSignal.timeout(MODEL_LIST_TIMEOUT_MS),
        maxContentLength: MAX_RESPONSE_BYTES,
    }))
    if (isNil(error)) {
        return { status: 'ok', body: response?.data }
    }
    if (safeHttp.isSsrfFilterError(error)) {
        return { status: 'blocked' }
    }
    const statusCode = isAxiosError(error) ? error.response?.status : undefined
    if (statusCode === 401 || statusCode === 403) {
        return { status: 'bad_key' }
    }
    const detail = error instanceof Error ? error.message : String(error)
    return isNil(statusCode) ? { status: 'unreachable', detail } : { status: 'http_error', detail }
}

function typeOfMode({ mode }: { mode: string | null | undefined }): AIProviderModelType | undefined {
    if (isNil(mode) || TEXT_MODES.includes(mode)) {
        return AIProviderModelType.TEXT
    }
    return IMAGE_MODES.includes(mode) ? AIProviderModelType.IMAGE : undefined
}

function toMetadata({ info, routedModel }: { info: ModelInfo | null | undefined, routedModel: string | null | undefined }): ProviderModelConfig['metadata'] {
    const realModel = info?.base_model ?? routedModel
    const metadata = {
        contextTokens: info?.max_input_tokens ?? undefined,
        maxOutputTokens: info?.max_output_tokens ?? undefined,
        inputCostPerMillionTokens: perMillion({ costPerToken: info?.input_cost_per_token }),
        outputCostPerMillionTokens: perMillion({ costPerToken: info?.output_cost_per_token }),
        cacheReadCostPerMillionTokens: perMillion({ costPerToken: info?.cache_read_input_token_cost }),
        cacheWriteCostPerMillionTokens: perMillion({ costPerToken: info?.cache_creation_input_token_cost }),
        supportsToolCalling: info?.supports_function_calling ?? undefined,
        supportsReasoning: info?.supports_reasoning ?? undefined,
        supportsVision: info?.supports_vision === true ? true : undefined,
        realModelId: isNil(realModel) ? undefined : realModel.slice(realModel.indexOf('/') + 1),
    }
    return Object.values(metadata).every(isNil) ? undefined : metadata
}

function perMillion({ costPerToken }: { costPerToken: number | null | undefined }): number | undefined {
    return isNil(costPerToken) ? undefined : Number((costPerToken * 1_000_000).toPrecision(12))
}

function firstPerId({ models }: { models: ProviderModelConfig[] }): ProviderModelConfig[] {
    const seen = new Set<string>()
    return models.filter((model) => {
        if (seen.has(model.modelId)) {
            return false
        }
        seen.add(model.modelId)
        return true
    })
}

function discoveryError({ discovery, config }: { discovery: Exclude<Discovery, { status: 'ok' }>, config: OpenAICompatibleProviderConfig }): ActivepiecesError {
    switch (discovery.status) {
        case 'bad_key':
            return validationError('LiteLLM rejected the API key. Check the key and the API key header.')
        case 'blocked':
            return validationError(`Activepieces blocked the request to ${config.baseUrl} because it points to a private or internal address. Add that IP or CIDR range to AP_SSRF_ALLOW_LIST, or add models by hand.`)
        case 'unreachable':
            return validationError(`Could not list the models of the LiteLLM at ${config.baseUrl}: ${discovery.detail}. Check the base URL, or add models by hand.`)
    }
}

function validationError(message: string): ActivepiecesError {
    return new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message } })
}

const OPENAI_PATH = '/v1'
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const TEXT_MODES = ['chat', 'responses', 'completion']
const IMAGE_MODES = ['image_generation', 'image_edit']
const NO_MODELS_MESSAGE = 'LiteLLM returned no chat or image models. Check which models this key can use in LiteLLM, or add models by hand.'

const ModelInfo = z.object({
    mode: z.string().nullish(),
    base_model: z.string().nullish(),
    max_input_tokens: z.number().nullish(),
    max_output_tokens: z.number().nullish(),
    input_cost_per_token: z.number().nullish(),
    output_cost_per_token: z.number().nullish(),
    cache_read_input_token_cost: z.number().nullish(),
    cache_creation_input_token_cost: z.number().nullish(),
    supports_function_calling: z.boolean().nullish(),
    supports_reasoning: z.boolean().nullish(),
    supports_vision: z.boolean().nullish(),
})

const ModelInfoRow = z.object({
    model_name: z.string(),
    litellm_params: z.object({ model: z.string().nullish() }).nullish(),
    model_info: ModelInfo.nullish(),
})

const ListResponse = z.object({ data: z.array(z.unknown()) })

const ModelIdsResponse = z.object({ data: z.array(z.object({ id: z.string() })) })

export const litellmDiscovery = { syncModels, mergeModels, fromModelInfo, proxyRoot }

type ModelInfo = z.infer<typeof ModelInfo>

type Discovery =
    | { status: 'ok', models: ProviderModelConfig[] }
    | { status: 'bad_key' }
    | { status: 'blocked' }
    | { status: 'unreachable', detail: string }

type JsonResult =
    | { status: 'ok', body: unknown }
    | { status: 'bad_key' }
    | { status: 'blocked' }
    | { status: 'unreachable', detail: string }
    | { status: 'http_error', detail: string }
