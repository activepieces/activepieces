import { AIProviderStrategy } from './ai-provider';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { GoogleProviderConfig, AIProviderModel, AIProviderModelType } from '@activepieces/common-ai';


export const googleProvider: AIProviderStrategy<GoogleProviderConfig> = {
    name() {
        return 'Google';
    },

    async listModels(config: GoogleProviderConfig): Promise<AIProviderModel[]> {
        const res = await httpClient.sendRequest<{ data: any[] }>({
            url: `https://generativelanguage.googleapis.com/v1beta/models?api_key=${config.apiKey}`,
            method: HttpMethod.GET,
            headers: {
                'x-goog-api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
        });

        const { data } = res.body;

        return data.map((model: any) => ({
            id: model.name,
            name: model.displayName,
            type: AIProviderModelType.TEXT,
        }));
    },
};
