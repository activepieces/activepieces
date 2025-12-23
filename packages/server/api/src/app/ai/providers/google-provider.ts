import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, GoogleProviderAuthConfig, GoogleProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const googleProvider: AIProviderStrategy<GoogleProviderAuthConfig, GoogleProviderConfig> = {
    name: 'Google',
    async listModels(authConfig: GoogleProviderAuthConfig, _config: GoogleProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ models: GoogleModel[] }>({
            url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
            method: HttpMethod.GET,
            headers: {
                'x-goog-api-key': authConfig.apiKey,
                'Content-Type': 'application/json',
            },
        })
        return res.body.models.map((model: GoogleModel) => ({
            id: model.name,
            name: model.displayName,
            type: model.name.includes('image') ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }))
    },
}

type GoogleModel = {
    name: string
    displayName: string
}