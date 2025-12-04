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

        const openaiImageModels = [
            'gpt-image-1',
            'dall-e-3',
            'dall-e-2'
        ]

        return data.map((model: any) => ({
            id: model.id,
            name: model.id,
            type: openaiImageModels.includes(model.id) ? 'image' : 'text',
        }));
    },

    authHeaders(config: OpenAIProviderConfig) {
        return {
            'Authorization': `Bearer ${config.apiKey}`,
        }
    }
};
