import { ActivepiecesError, AIProviderModel, ErrorCode, isNil, OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig, tryCatchSync } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const openAICompatibleProvider: AIProviderStrategy<OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig> = {
    name: 'OpenAI Compatible',
    async validateConnection(_: OpenAICompatibleProviderAuthConfig, providerConfig: OpenAICompatibleProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        assertUsableBaseUrl({ baseUrl: providerConfig.baseUrl })
        assertUsableHeaderName({ name: providerConfig.apiKeyHeader, field: 'The API key header' })
        for (const name of Object.keys(providerConfig.defaultHeaders ?? {})) {
            assertUsableHeaderName({ name, field: `The extra header "${name}"` })
        }
    },
    async listModels(_authConfig: OpenAICompatibleProviderAuthConfig, config: OpenAICompatibleProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map(m => ({
            id: m.modelId,
            name: m.modelName,
            type: m.modelType,
        }))
    },
}

function assertUsableBaseUrl({ baseUrl }: { baseUrl: string }): void {
    const { error } = tryCatchSync(() => new URL(baseUrl))
    if (isNil(error)) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `"${baseUrl}" is not a valid base URL. Enter the full address of the API, including the scheme, for example https://api.example.com/v1` },
    })
}

function assertUsableHeaderName({ name, field }: { name: string, field: string }): void {
    const { error } = tryCatchSync(() => new Headers({ [name]: HEADER_PROBE_VALUE }))
    if (isNil(error)) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `${field} cannot be "${name}". Enter the header name on its own, for example Authorization, and put its value in the API key field` },
    })
}

const HEADER_PROBE_VALUE = 'probe'
