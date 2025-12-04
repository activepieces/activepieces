import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { AIProviderStrategy, ProviderModel } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type OpenAIProviderConfig = {
    apiKey: string;
}

export const openaiProvider: AIProviderStrategy<OpenAIProviderConfig> = {
    name() {
        return 'OpenAI';
    },

    async listModels(config: OpenAIProviderConfig): Promise<ProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: any[] }>({
            url: `https://api.openai.com/v1/models`,
            method: HttpMethod.GET,
            headers: {
                ...this.authHeaders(config),
                'Content-Type': 'application/json',
            },
        });

        const { data } = res.body;

        return data.map((model: any) => ({
            id: model.id,
            name: model.id,
            type: 'text',
        }));
    },

    authHeaders(config: OpenAIProviderConfig) {
        return {
            'Authorization': `Bearer ${config.apiKey}`,
        }
    }
};
