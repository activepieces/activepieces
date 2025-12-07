import { AIProviderModel, AIProviderModelType, GoogleProviderConfig } from '@activepieces/common-ai'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderStrategy } from './ai-provider'


export const googleProvider: AIProviderStrategy<GoogleProviderConfig> = {
    name: 'Google',
    async listModels(config: GoogleProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: GoogleModel[] }>({
            url: `https://generativelanguage.googleapis.com/v1beta/models?api_key=${config.apiKey}`,
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