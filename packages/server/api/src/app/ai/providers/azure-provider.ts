import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, AzureProviderAuthConfig, AzureProviderConfig } from '@activepieces/shared'
import { AIProviderStrategy } from './ai-provider'

export const azureProvider: AIProviderStrategy<AzureProviderAuthConfig, AzureProviderConfig> = {
    name: 'Azure OpenAI',
    async listModels(authConfig: AzureProviderAuthConfig, config: AzureProviderConfig): Promise<AIProviderModel[]> {
        const endpoint = `https://${config.resourceName}.openai.azure.com`
        const apiKey = authConfig.apiKey
        const apiVersion = '2024-10-21'

        if (!endpoint || !apiKey) {
            return []
        }

        const res = await httpClient.sendRequest<{ data: AzureModel[] }>({
            url: `${endpoint}/openai/deployments?api-version=${apiVersion}`,
            method: HttpMethod.GET,
            headers: {
                'api-key': apiKey,
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