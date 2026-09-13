import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, GoogleProviderAuthConfig, GoogleProviderConfig, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const googleProvider: AIProviderStrategy<GoogleProviderAuthConfig, GoogleProviderConfig> = {
    name: 'Google',
    async validateConnection(authConfig: GoogleProviderAuthConfig, config: GoogleProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await googleProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: GoogleProviderAuthConfig, _config: GoogleProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ models: GoogleModel[] }>({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
            method: HttpMethod.GET,
            headers: {
                'x-goog-api-key': authConfig.apiKey,
                'Content-Type': 'application/json',
            },
        })
        return res.body.models
            .filter((model: GoogleModel) => supportsGenerateContent(model))
            .map((model: GoogleModel) => ({
                id: stripModelsPrefix(model.name),
                name: model.displayName,
                type: model.name.includes('image') ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
            }))
    },
}

const GOOGLE_MODEL_PREFIX = 'models/'

const GENERATE_CONTENT_METHOD = 'generateContent'

function stripModelsPrefix(modelName: string): string {
    return modelName.startsWith(GOOGLE_MODEL_PREFIX) ? modelName.slice(GOOGLE_MODEL_PREFIX.length) : modelName
}

function supportsGenerateContent(model: GoogleModel): boolean {
    return isNil(model.supportedGenerationMethods) || model.supportedGenerationMethods.includes(GENERATE_CONTENT_METHOD)
}

type GoogleModel = {
    name: string
    displayName: string
    supportedGenerationMethods?: string[]
}