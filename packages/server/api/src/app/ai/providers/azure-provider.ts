import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, AzureProviderAuthConfig, AzureProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const azureProvider: AIProviderStrategy<AzureProviderAuthConfig, AzureProviderConfig> = {
    name: 'Azure OpenAI',
    async validateConnection(authConfig: AzureProviderAuthConfig, config: AzureProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await azureProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: AzureProviderAuthConfig, config: AzureProviderConfig): Promise<AIProviderModel[]> {
        const endpoint = `https://${config.resourceName}.openai.azure.com`
        const apiKey = authConfig.apiKey

        if (!endpoint || !apiKey) {
            return []
        }

        const res = await httpClient.sendRequest<{ data: AzureDeployment[] }>({
            url: `${endpoint}/openai/deployments?api-version=${AZURE_DEPLOYMENTS_API_VERSION}`,
            method: HttpMethod.GET,
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
            },
        })

        const { data } = res.body

        return data.map((deployment: AzureDeployment) => ({
            id: deployment.id,
            name: deployment.id,
            type: AIProviderModelType.TEXT,
        }))
    },
}

const AZURE_DEPLOYMENTS_API_VERSION = '2023-03-15-preview'

type AzureDeployment = {
    id: string
}
