import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { AIProviderStrategy, ProviderModel } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type AzureProviderConfig = {
    apiKey: string;
    resourceName: string;
}

export const azureProvider: AIProviderStrategy<AzureProviderConfig> = {
    name() {
        return 'Azure OpenAI';
    },

    async listModels(config: AzureProviderConfig): Promise<ProviderModel[]> {
        const endpoint = `${config.resourceName}.openai.azure.com`;
        const apiKey = config.apiKey;
        const apiVersion = '2024-10-21';

        if (!endpoint || !apiKey) {
            return [];
        }

        const res = await httpClient.sendRequest<{ data: any[] }>({
            url: `${endpoint}/openai/deployments?api-version=${apiVersion}`,
            method: HttpMethod.GET,
            headers: {
                ...this.authHeaders(config),
                'Content-Type': 'application/json',
            },
        });

        const { data } = res.body;

        return data.map((deployment: any) => ({
            id: deployment.name,
            name: deployment.name,
            type: 'text',
        }));
    },

    authHeaders(config: AzureProviderConfig) {
        return {
            'api-key': config.apiKey,
        }
    }
};
