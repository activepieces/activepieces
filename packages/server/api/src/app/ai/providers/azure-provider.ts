import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderModel, AIProviderModelType, AZURE_RESOURCE_NAME_PATTERN, AzureProviderAuthConfig, AzureProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const azureProvider: AIProviderStrategy<AzureProviderAuthConfig, AzureProviderConfig> = {
    name: 'Azure OpenAI',
    async validateConnection(authConfig: AzureProviderAuthConfig, config: AzureProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await azureProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: AzureProviderAuthConfig, config: AzureProviderConfig): Promise<AIProviderModel[]> {
        const apiKey = authConfig.apiKey

        if (!apiKey) {
            return []
        }

        const resourceName = config.resourceName ?? ''
        if (!AZURE_RESOURCE_NAME_PATTERN.test(resourceName)) {
            throw new Error('Azure resource name must be alphanumerics and hyphens only, up to 64 characters')
        }

        const endpoint = `https://${resourceName}.openai.azure.com`

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
