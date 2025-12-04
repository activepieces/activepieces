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

        // Map deployments to ProviderModel format
        return data.map((deployment: any) => ({
            id: deployment.name,
            name: deployment.name,
            type: 'text',
        }));
    },

    validateConfig(config: object): AzureProviderConfig {
        if (
            'apiKey' in config && 
            typeof config.apiKey === 'string' &&
            'resourceName' in config &&
            typeof config.resourceName === 'string'
        ) {
            return {
                apiKey: config.apiKey,
                resourceName: config.resourceName,
            }
        }

        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {}
        })
    },

    configSchema() {
        return [
            {
                attribute: 'apiKey',
                label: 'API Key',
                type: 'string',
            },
            {
                attribute: 'resourceName',
                label: 'Resource Name',
                type: 'string',
            }
        ]
    },

    authHeaders(config: AzureProviderConfig) {
        return {
            'api-key': config.apiKey,
        }
    }
};
