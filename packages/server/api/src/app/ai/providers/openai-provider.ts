import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { AIProviderStrategy, ProviderModel } from './ai-provider';

const openaiModels: ProviderModel[] = [
    // GPT-5 family (flagship)
    { id: 'gpt-5',                 name: 'GPT-5',                   type: 'text' },
    { id: 'gpt-5-2025-08-07',      name: 'GPT-5 (Aug 2025)',        type: 'text' },
    { id: 'gpt-5-mini',            name: 'GPT-5 Mini',              type: 'text' },
    { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini (Aug 2025)',   type: 'text' },
    { id: 'gpt-5-nano',            name: 'GPT-5 Nano',              type: 'text' },
    { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano (Aug 2025)',   type: 'text' },
    { id: 'gpt-5-chat-latest',     name: 'GPT-5 Chat (Latest)',     type: 'text' },

    // GPT-4.1 family
    { id: 'gpt-4.1',               name: 'GPT-4.1',                 type: 'text' },
    { id: 'gpt-4.1-2025-04-14',    name: 'GPT-4.1 (Apr 2025)',      type: 'text' },
    { id: 'gpt-4.1-mini',          name: 'GPT-4.1 Mini',            type: 'text' },
    { id: 'gpt-4.1-mini-2025-04-14', name: 'GPT-4.1 Mini (Apr 2025)', type: 'text' },
    { id: 'gpt-4.1-nano',          name: 'GPT-4.1 Nano',            type: 'text' },
    { id: 'gpt-4.1-nano-2025-04-14', name: 'GPT-4.1 Nano (Apr 2025)', type: 'text' },

    // GPT-4o family
    { id: 'gpt-4o',                name: 'GPT-4o',                  type: 'text' },
    { id: 'gpt-4o-2024-05-13',     name: 'GPT-4o (May 2024)',       type: 'text' },
    { id: 'gpt-4o-2024-08-06',     name: 'GPT-4o (Aug 2024)',       type: 'text' },
    { id: 'gpt-4o-2024-11-20',     name: 'GPT-4o (Nov 2024)',       type: 'text' },
    { id: 'gpt-4o-mini',           name: 'GPT-4o Mini',             type: 'text' },
    { id: 'gpt-4o-mini-2024-07-18', name: 'GPT-4o Mini (Jul 2024)',  type: 'text' },

    // GPT-4 turbo family
    { id: 'gpt-4-turbo',           name: 'GPT-4 Turbo',             type: 'text' },
    { id: 'gpt-4-turbo-2024-04-09', name: 'GPT-4 Turbo (Apr 2024)',  type: 'text' },

    // GPT-4 family (older)
    { id: 'gpt-4',                 name: 'GPT-4',                   type: 'text' },
    { id: 'gpt-4-0613',            name: 'GPT-4 (Jun 2024)',        type: 'text' },

    // GPT-3.5 turbo family
    { id: 'gpt-3.5-turbo',         name: 'GPT-3.5 Turbo',           type: 'text' },
    { id: 'gpt-3.5-turbo-0125',    name: 'GPT-3.5 Turbo (Jan 2025)', type: 'text' },
    { id: 'gpt-3.5-turbo-1106',    name: 'GPT-3.5 Turbo (Nov 2024)', type: 'text' },

    // ChatGPT 4o latest alias
    { id: 'chatgpt-4o-latest',     name: 'ChatGPT 4o (Latest)',     type: 'text' },

    // Legacy / other
    { id: 'o1',                    name: 'OpenAI o1 legacy',        type: 'text' },
    { id: 'o1-2024-12-17',         name: 'OpenAI o1 (Dec 2024)',    type: 'text' },
    { id: 'o3-mini',               name: 'OpenAI o3 Mini',          type: 'text' },
    { id: 'o3-mini-2025-01-31',    name: 'OpenAI o3 Mini (Jan 2025)', type: 'text' },
    { id: 'o3',                   name: 'OpenAI o3',               type: 'text' },
    { id: 'o3-2025-04-16',         name: 'OpenAI o3 (Apr 2025)',    type: 'text' },

    // Image models
    { id: 'gpt-image-1',           name: 'GPT Image 1',             type: 'image' },
    { id: 'dall-e-3',              name: 'DALL·E 3',                type: 'image' },
    { id: 'dall-e-2',              name: 'DALL·E 2',                type: 'image' },
];

export type OpenAIProviderConfig = {
    apiKey: string;
}

export const openaiProvider: AIProviderStrategy<OpenAIProviderConfig> = {
    name() {
        return 'OpenAI';
    },

    async listModels(): Promise<ProviderModel[]> {
        return openaiModels;
    },

    validateConfig(config: object): OpenAIProviderConfig {
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

    authHeaders(config: OpenAIProviderConfig) {
        return {
            'Authorization': `Bearer ${config.apiKey}`,
        }
    }
};
