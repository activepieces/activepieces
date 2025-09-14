import { Property, InputPropertyMap } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ImageModel } from 'ai';
import { isNil, SeekPage } from '@activepieces/shared';
import { SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from './supported-ai-providers';
import { AIProviderWithoutSensitiveData } from './types';

export const aiProps = <T extends 'language' | 'image' | 'video'>({ modelType, functionCalling }: AIPropsParams<T>): AIPropsReturn => ({
    provider: Property.Dropdown<string, true>({
        displayName: 'Provider',
        required: true,
        refreshers: [],
        options: async (_, ctx) => {
            const { body: { data: supportedProviders } } = await httpClient.sendRequest<
                SeekPage<AIProviderWithoutSensitiveData>
            >({
                method: HttpMethod.GET,
                url: `${ctx.server.apiUrl}v1/ai-providers`,
                headers: {
                    Authorization: `Bearer ${ctx.server.token}`,
                },
            });
            if (supportedProviders.length === 0) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'No AI providers configured by the admin.',
                };
            }

            const providers = supportedProviders.map(supportedProvider => {
                const provider = SUPPORTED_AI_PROVIDERS.find(p => p.provider === supportedProvider.provider);
                if (!provider) return null;

                if (modelType === 'language') {
                    if (provider.languageModels.length === 0) return null;

                    if (functionCalling && !provider.languageModels.some(model => model.functionCalling)) {
                        return null;
                    }
                } else if (modelType === 'image') {
                    if (provider.imageModels.length === 0) return null;
                } else if (modelType === 'video') {
                    if (provider.videoModels.length === 0) return null;
                }

                return {
                    value: provider.provider,
                    label: provider.displayName
                };
            });

            const filteredProviders = providers.filter(p => p !== null);

            return {
                placeholder: filteredProviders.length > 0 ? 'Select AI Provider' : `No providers available for ${modelType} models${functionCalling ? ' with function calling' : ''}`,
                disabled: filteredProviders.length === 0,
                options: filteredProviders,
            };
        },
    }),
    model: Property.Dropdown({
        displayName: 'Model',
        required: true,
        defaultValue: 'gpt-4o',
        refreshers: ['provider'],
        options: async (propsValue) => {
            const provider = propsValue['provider'] as string;
            if (isNil(provider)) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Select AI Provider',
                };
            }

            const supportedProvider = SUPPORTED_AI_PROVIDERS.find(p => p.provider === provider);
            if (isNil(supportedProvider)) {
                return {
                    disabled: true,
                    options: [],
                };
            }

            const allModels = modelType === 'language' ? supportedProvider.languageModels : modelType === 'image' ? supportedProvider.imageModels : supportedProvider.videoModels;
            const models = (modelType === 'language' && functionCalling)
                ? allModels.filter(model => (model as SupportedAIProvider['languageModels'][number]).functionCalling)
                : allModels;

            return {
                placeholder: 'Select AI Model',
                disabled: false,
                options: models.map(model => ({
                    label: model.displayName,
                    value: model.instance,
                })),
            };
        },
    }),
    advancedOptions: Property.DynamicProperties({
        displayName: 'Advanced Options',
        required: false,
        refreshers: ['provider', 'model'],
        props: async (propsValue): Promise<InputPropertyMap> => {
            const provider = propsValue['provider'] as unknown as string;
            const model = propsValue['model'] as unknown as ImageModel;

            const providerMetadata = SUPPORTED_AI_PROVIDERS.find(p => p.provider === provider);
            if (isNil(providerMetadata)) {
                return {};
            }

            let options: InputPropertyMap = {};

            if (modelType === 'image') {
                if (provider === 'openai') {
                    options = {
                        quality: Property.StaticDropdown({
                            options: {
                                options: model.modelId === 'dall-e-3' ? [
                                    { label: 'Standard', value: 'standard' },
                                    { label: 'HD', value: 'hd' },
                                ] : model.modelId === 'gpt-image-1' ? [
                                    { label: 'High', value: 'high' },
                                    { label: 'Medium', value: 'medium' },
                                    { label: 'Low', value: 'low' },
                                ] : [],
                                disabled: model.modelId === 'dall-e-2',
                            },
                            defaultValue: model.modelId === 'dall-e-3' ? 'standard' : 'high',
                            displayName: 'Image Quality',
                            required: false,
                        }),
                        size: Property.StaticDropdown({
                            options: {
                                options: model.modelId === 'dall-e-3' ? [
                                    { label: '1024x1024', value: '1024x1024' },
                                    { label: '1792x1024', value: '1792x1024' },
                                    { label: '1024x1792', value: '1024x1792' },
                                ] : model.modelId === 'gpt-image-1' ? [
                                    { label: '1024x1024', value: '1024x1024' },
                                    { label: '1536x1024', value: '1536x1024' },
                                    { label: '1024x1536', value: '1024x1536' },
                                ] : [
                                    { label: '256x256', value: '256x256' },
                                    { label: '512x512', value: '512x512' },
                                    { label: '1024x1024', value: '1024x1024' },
                                ],
                            },
                            displayName: 'Image Size',
                            required: false,
                        }),
                    }

                    if (model.modelId === 'gpt-image-1') {
                        options = {
                            ...options,
                            background: Property.StaticDropdown({
                                options: {
                                    options: [
                                        { label: 'Auto', value: 'auto' },
                                        { label: 'Transparent', value: 'transparent' },
                                        { label: 'Opaque', value: 'opaque' },
                                    ],
                                },
                                defaultValue: 'auto',
                                description: 'The background of the image.',
                                displayName: 'Background',
                                required: true,
                            }),
                        }
                    }

                    return options;
                }

                if (provider === 'replicate') {
                    options = {
                        negativePrompt: Property.ShortText({
                            displayName: 'Negative Prompt',
                            required: true,
                            description: 'A prompt to avoid in the generated image.',
                        }),
                    }
                }
                if(provider === 'google' && model.modelId === 'gemini-2.5-flash-image-preview') {
                    options = {
                        image: Property.Array({
                            displayName: 'Images',
                            required:false,
                            properties: {
                                file: Property.File({
                                    displayName: 'Image File',
                                    required: true,
                                }),
                            },
                            description: 'The image(s) you want to edit/merge',
                        })
                }
            }
            } else if (modelType === 'video') {
                if (provider === 'google') {
                    if (model.modelId === 'veo-2.0-generate-001') {
                        options = {
                            aspectRatio: Property.StaticDropdown({
                                displayName: 'Aspect Ratio',
                                required: false,
                                defaultValue: '16:9',
                                options: {
                                    options: [
                                        { label: '16:9', value: '16:9' },
                                        { label: '9:16', value: '9:16' },
                                    ],
                                },
                            }),
                            personGeneration: Property.StaticDropdown({
                                displayName: 'Person Generation',
                                required: false,
                                options: {
                                    options: [
                                        { label: 'Allow Adult', value: 'allow_adult' },
                                        { label: 'Don\'t Allow', value: 'dont_allow' },
                                        { label: 'Allow All', value: 'allow_all' },
                                    ],
                                },
                            }),
                        }
                    }
                    
                }
            }

            return options;
        },
    }),
    webSearch: Property.Checkbox({
        displayName: 'Web Search',
        required: false,
        defaultValue: false,
        description: 'Whether to use web search to find information for the AI to use in its response.',
    }),
    webSearchOptions: Property.DynamicProperties({
        displayName: 'Web Search Options',
        required: false,
        refreshers: ['webSearch', 'provider', 'model'],
        props: async (propsValue) => {
            const webSearchEnabled = propsValue['webSearch'] as unknown as boolean;
            const provider = propsValue['provider'] as unknown as string;

            if (!webSearchEnabled) {
                return {};
            }

            const providerMetadata = SUPPORTED_AI_PROVIDERS.find(p => p.provider === provider);
            if (isNil(providerMetadata)) {
                return {};
            }

            let options: InputPropertyMap = {
                maxUses: Property.Number({
                    displayName: 'Max Web Search Uses',
                    required: false,
                    defaultValue: 5,
                    description: 'Maximum number of searches to use. Default is 5.',
                }),
                includeSources: Property.Checkbox({
                    displayName: 'Include Sources',
                    description: 'Whether to include the sources in the response. Useful for getting web search details (e.g. search queries, searched URLs, etc).',
                    required: false,
                    defaultValue: false,
                }),
            };

            const userLocationOptions = {
                userLocationCity: Property.ShortText({
                    displayName: 'User Location - City',
                    required: false,
                    description: 'The city name for localizing search results (e.g., San Francisco).',
                }),
                userLocationRegion: Property.ShortText({
                    displayName: 'User Location - Region',
                    required: false,
                    description: 'The region or state for localizing search results (e.g., California).',
                }),
                userLocationCountry: Property.ShortText({
                    displayName: 'User Location - Country',
                    required: false,
                    description: 'The country code for localizing search results (e.g., US).',
                }),
                userLocationTimezone: Property.ShortText({
                    displayName: 'User Location - Timezone',
                    required: false,
                    description: 'The IANA timezone ID for localizing search results (e.g., America/Los_Angeles).',
                }),
            };

            if (provider === 'anthropic') {
                options = {
                    ...options,
                    allowedDomains: Property.Array({
                        displayName: 'Allowed Domains',
                        required: false,
                        description: 'List of domains to search (e.g., example.com, docs.example.com/blog). Domains should not include HTTP/HTTPS scheme. Subdomains are automatically included unless more specific subpaths are provided. Overrides Blocked Domains if both are provided.',
                        properties: {
                            domain: Property.ShortText({
                                displayName: 'Domain',
                                required: true,
                            }),
                        },
                    }),
                    blockedDomains: Property.Array({
                        displayName: 'Blocked Domains',
                        required: false,
                        description: 'List of domains to exclude from search (e.g., example.com, docs.example.com/blog). Domains should not include HTTP/HTTPS scheme. Subdomains are automatically included unless more specific subpaths are provided. Overrided by Allowed Domains if both are provided.',
                        properties: {
                            domain: Property.ShortText({
                                displayName: 'Domain',
                                required: true,
                            }),
                        },
                    }),
                    ...userLocationOptions,
                };
            }

            if (provider === 'openai') {
                options = {
                    ...options,
                    searchContextSize: Property.StaticDropdown({
                        displayName: 'Search Context Size',
                        required: false,
                        defaultValue: 'medium',
                        options: {
                            options: [
                                { label: 'Low', value: 'low' },
                                { label: 'Medium', value: 'medium' },
                                { label: 'High', value: 'high' },
                            ],
                        },
                        description: 'High level guidance for the amount of context window space to use for the search.',
                    }),
                    ...userLocationOptions,
                };
            }

            return options;
        },
    }),
})


type AIPropsParams<T extends 'language' | 'image' | 'video'> = {
    modelType: T,
    functionCalling?: T extends 'language' ? boolean : never
}

type AIPropsReturn = {
    provider: ReturnType<typeof Property.Dropdown<string, true>>;
    model: ReturnType<typeof Property.Dropdown>;
    advancedOptions: ReturnType<typeof Property.DynamicProperties>;
    webSearch: ReturnType<typeof Property.Checkbox>;
    webSearchOptions: ReturnType<typeof Property.DynamicProperties>;
}
