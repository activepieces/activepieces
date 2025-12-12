import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, GoogleProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const googleProvider: AIProviderStrategy<GoogleProviderConfig> = {
    name: 'Google',
    async listModels(config: GoogleProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: GoogleModel[] }>({
            url: 'https://generativelanguage.googleapis.com/v1beta/models',
            method: HttpMethod.GET,
            headers: {
                'x-goog-api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((model: GoogleModel) => ({
            id: model.name,
            name: model.displayName,
            type: AIProviderModelType.TEXT,
        }))
    },
}

type GoogleModel = {
    name: string
    displayName: string
}