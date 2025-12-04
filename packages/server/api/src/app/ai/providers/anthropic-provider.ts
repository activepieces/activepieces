import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { AIProviderStrategy, ProviderModel } from './ai-provider';

const anthropicModels: ProviderModel[] = [
    // Claude 4 family (May 2025)
    { id: 'claude-opus-4-20250514',      name: 'Claude Opus 4 (May 2025)',     type: 'text' },
    { id: 'claude-sonnet-4-20250514',    name: 'Claude Sonnet 4 (May 2025)',   type: 'text' },

    // Claude 3.7 Sonnet
    { id: 'claude-3-7-sonnet-20250219',  name: 'Claude 3.7 Sonnet (Feb 2025)', type: 'text' },

    // Claude 3.5 Sonnet family
    { id: 'claude-3-5-sonnet-latest',    name: 'Claude 3.5 Sonnet (Latest)',   type: 'text' },
    { id: 'claude-3-5-sonnet-20241022',  name: 'Claude 3.5 Sonnet (Oct 2024)', type: 'text' },
    { id: 'claude-3-5-sonnet-20240620',  name: 'Claude 3.5 Sonnet (Jun 2024)', type: 'text' },

    // Claude 3.5 Haiku family
    { id: 'claude-3-5-haiku-latest',     name: 'Claude 3.5 Haiku (Latest)',    type: 'text' },
    { id: 'claude-3-5-haiku-20241022',   name: 'Claude 3.5 Haiku (Oct 2024)',  type: 'text' },

    // Claude 3 family
    { id: 'claude-3-opus-latest',        name: 'Claude 3 Opus (Latest)',        type: 'text' },
    { id: 'claude-3-opus-20240229',      name: 'Claude 3 Opus (Feb 2024)',     type: 'text' },
    { id: 'claude-3-sonnet-20240229',    name: 'Claude 3 Sonnet (Feb 2024)',   type: 'text' },
    { id: 'claude-3-haiku-20240307',     name: 'Claude 3 Haiku (Mar 2024)',    type: 'text' },
];

export type AnthropicProviderConfig = {
    apiKey: string;
}

export const anthropicProvider: AIProviderStrategy<AnthropicProviderConfig> = {
    name() {
        return 'Anthropic';
    },

    async listModels(config: AnthropicProviderConfig): Promise<ProviderModel[]> {
        return anthropicModels;
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

    validateConfig(config: object): AnthropicProviderConfig {
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

    authHeaders(config: AnthropicProviderConfig) {
        return {
            'x-api-key': config.apiKey,
        }
    }
};
