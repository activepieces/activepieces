import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, AzureProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const azureProvider: AIProviderStrategy<AzureProviderConfig> = {
    name: 'Azure OpenAI',
    async listModels(config: AzureProviderConfig): Promise<AIProviderModel[]> {
        const endpoint = `https://${config.resourceName}.openai.azure.com`
        const apiKey = config.apiKey
        const apiVersion = '2024-10-21'

        if (!endpoint || !apiKey) {
            return []
        }

        const res = await httpClient.sendRequest<{ data: AzureModel[] }>({
            url: `${endpoint}/openai/deployments?api-version=${apiVersion}`,
            method: HttpMethod.GET,
            headers: {
                'api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((deployment: AzureModel) => ({
            id: deployment.name,
            name: deployment.name,
            type: AIProviderModelType.TEXT,
        }))
    },
}

type AzureModel = {
    name: string
}