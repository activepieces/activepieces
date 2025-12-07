import { AIProviderStrategy } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AnthropicProviderConfig, AIProviderModel, AIProviderModelType } from '@activepieces/common-ai';

export const anthropicProvider: AIProviderStrategy<AnthropicProviderConfig> = {
    name: 'Anthropic',
    async listModels(config: AnthropicProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: { id: string; display_name: string }[] }>({
            url: `https://api.anthropic.com/v1/models`,
            method: HttpMethod.GET,
            headers: {
                'x-api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
        });

        const { data } = res.body;

        return data.map(model => ({
            id: model.id,
            name: model.display_name,
            type: AIProviderModelType.TEXT,
        }));
    },
};
