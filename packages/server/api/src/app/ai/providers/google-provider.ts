import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { AIProviderStrategy, ProviderModel } from './ai-provider';

const googleModels: ProviderModel[] = [
    // Gemini 2.5 family (latest)
    { id: 'gemini-2.5-pro',              name: 'Gemini 2.5 Pro',                type: 'text' },
    { id: 'gemini-2.5-flash',            name: 'Gemini 2.5 Flash',              type: 'text' },
    { id: 'gemini-2.5-flash-lite',       name: 'Gemini 2.5 Flash Lite',         type: 'text' },
    { id: 'gemini-2.5-pro-exp-03-25',    name: 'Gemini 2.5 Pro Exp (Mar 2025)', type: 'text' },
    { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview (Apr 2025)', type: 'text' },

    // Gemini 2.0 family
    { id: 'gemini-2.0-flash',            name: 'Gemini 2.0 Flash',              type: 'text' },
    { id: 'gemini-2.0-flash-001',        name: 'Gemini 2.0 Flash 001',          type: 'text' },
    { id: 'gemini-2.0-flash-live-001',   name: 'Gemini 2.0 Flash Live 001',     type: 'text' },
    { id: 'gemini-2.0-flash-lite',       name: 'Gemini 2.0 Flash Lite',         type: 'text' },
    { id: 'gemini-2.0-pro-exp-02-05',    name: 'Gemini 2.0 Pro Exp (Feb 2025)', type: 'text' },
    { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking Exp (Jan 2025)', type: 'text' },
    { id: 'gemini-2.0-flash-exp',        name: 'Gemini 2.0 Flash Exp',          type: 'text' },

    // Gemini 1.5 family
    { id: 'gemini-1.5-flash',            name: 'Gemini 1.5 Flash',              type: 'text' },
    { id: 'gemini-1.5-flash-latest',     name: 'Gemini 1.5 Flash (Latest)',     type: 'text' },
    { id: 'gemini-1.5-flash-001',        name: 'Gemini 1.5 Flash 001',          type: 'text' },
    { id: 'gemini-1.5-flash-002',        name: 'Gemini 1.5 Flash 002',          type: 'text' },
    { id: 'gemini-1.5-flash-8b',         name: 'Gemini 1.5 Flash 8B',           type: 'text' },
    { id: 'gemini-1.5-flash-8b-latest',  name: 'Gemini 1.5 Flash 8B (Latest)',  type: 'text' },
    { id: 'gemini-1.5-flash-8b-001',     name: 'Gemini 1.5 Flash 8B 001',       type: 'text' },
    { id: 'gemini-1.5-pro',              name: 'Gemini 1.5 Pro',                type: 'text' },
    { id: 'gemini-1.5-pro-latest',       name: 'Gemini 1.5 Pro (Latest)',       type: 'text' },
    { id: 'gemini-1.5-pro-001',          name: 'Gemini 1.5 Pro 001',            type: 'text' },
    { id: 'gemini-1.5-pro-002',          name: 'Gemini 1.5 Pro 002',            type: 'text' },

    // Gemma family
    { id: 'gemma-3-12b-it',              name: 'Gemma 3 12B Instruct',          type: 'text' },
    { id: 'gemma-3-27b-it',              name: 'Gemma 3 27B Instruct',          type: 'text' },

    // Experimental
    { id: 'gemini-exp-1206',             name: 'Gemini Exp 1206',               type: 'text' },

    // Image models
    { id: 'imagen-3.0-generate-002',     name: 'Imagen 3.0 Generate 002',       type: 'image' },
];

export type GoogleProviderConfig = {
    apiKey: string;
}


export const googleProvider: AIProviderStrategy<GoogleProviderConfig> = {
    name() {
        return 'Google';
    },

    async listModels(config: GoogleProviderConfig): Promise<ProviderModel[]> {
        return googleModels;
    },

    validateConfig(config: object): GoogleProviderConfig {
        if ('apiKey' in config && typeof config.apiKey === 'string') {
            return {
                apiKey: config.apiKey,
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
        ]
    },

    authHeaders(config: GoogleProviderConfig) {
        return {
            'x-goog-api-key': config.apiKey,
        }
    }
};
