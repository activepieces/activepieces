import { AIProviderStrategy } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AIProviderModelType, OpenRouterProviderConfig, AIProviderModel } from '@activepieces/common-ai';

export const openRouterProvider: AIProviderStrategy<OpenRouterProviderConfig> = {
    name() {
        return 'Open Router';
    },

    async listModels(config: OpenRouterProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: any[] }>({
            url: `https://api.openrouter.ai/v1/models`,
            method: HttpMethod.GET,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const { data } = res.body;

        return data.map((model: any) => ({
            id: model.id,
            name: model.name,
            type: model.architecture.output_modalities.includes('image') ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
        }));
    },
};
