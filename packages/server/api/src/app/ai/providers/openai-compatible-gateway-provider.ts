import { ActivepiecesError, AIProviderModel, ErrorCode, isNil, OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig, tryCatchSync } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const openAICompatibleProvider: AIProviderStrategy<OpenAICompatibleProviderAuthConfig, OpenAICompatibleProviderConfig> = {
    name: 'OpenAI Compatible',
    async validateConnection(authConfig: OpenAICompatibleProviderAuthConfig, providerConfig: OpenAICompatibleProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        assertUsableBaseUrl({ baseUrl: providerConfig.baseUrl })
        assertUsableHeader({ name: providerConfig.apiKeyHeader, value: authConfig.apiKey, field: 'The API key header' })
        for (const [name, value] of Object.entries(providerConfig.defaultHeaders ?? {})) {
            assertUsableHeader({ name, value, field: `The extra header "${name}"` })
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
    const { data: parsed } = tryCatchSync(() => new URL(baseUrl))
    if (!isNil(parsed) && HTTP_PROTOCOLS.includes(parsed.protocol)) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `"${baseUrl}" is not a valid base URL. Enter the full address of the API over http or https, for example https://api.example.com/v1` },
    })
}

function assertUsableHeader({ name, value, field }: { name: string, value: string, field: string }): void {
    const { error } = tryCatchSync(() => new Headers({ [name]: value }))
    if (isNil(error)) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `${field} cannot be sent as written. Enter the header name on its own, for example Authorization, put its value in the API key field, and keep line breaks out of both` },
    })
}

const HTTP_PROTOCOLS = ['http:', 'https:']
