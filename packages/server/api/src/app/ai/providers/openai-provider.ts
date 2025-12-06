import { OpenAIProviderConfig, AIProviderModel, AIProviderModelType } from '@activepieces/common-ai';
import { AIProviderStrategy } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const openaiProvider: AIProviderStrategy<OpenAIProviderConfig> = {
    name: 'OpenAI',
    async listModels(config: OpenAIProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: any[] }>({
            url: `https://api.openai.com/v1/models`,
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
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
            type: openaiImageModels.includes(model.id) ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }));
    },
};
