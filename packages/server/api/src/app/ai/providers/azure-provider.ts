import { AIProviderStrategy } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AzureProviderConfig, AIProviderModel, AIProviderModelType } from '@activepieces/common-ai';

export const azureProvider: AIProviderStrategy<AzureProviderConfig> = {
    name() {
        return 'Azure OpenAI';
    },

    async listModels(config: AzureProviderConfig): Promise<AIProviderModel[]> {
        const endpoint = `https://${config.resourceName}.openai.azure.com`;
        const apiKey = config.apiKey;
        const apiVersion = '2024-10-21';

        if (!endpoint || !apiKey) {
            return [];
        }

        const res = await httpClient.sendRequest<{ data: any[] }>({
            url: `${endpoint}/openai/deployments?api-version=${apiVersion}`,
            method: HttpMethod.GET,
            headers: {
                'api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
        });

        const { data } = res.body;

        return data.map((deployment: any) => ({
            id: deployment.name,
            name: deployment.name,
            type: AIProviderModelType.Text,
        }));
    },
};
