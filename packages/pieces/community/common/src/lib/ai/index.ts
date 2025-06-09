import { isNil, SeekPage, AIProviderWithoutSensitiveData, SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared';
import { Property, InputPropertyMap } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '../http';

export const aiProps = <T extends 'language' | 'image'>({ modelType, functionCalling }: AIPropsParams<T>): AIPropsReturn => ({
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

            const allModels = modelType === 'language' ? supportedProvider.languageModels : supportedProvider.imageModels;
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

            const providerMetadata = SUPPORTED_AI_PROVIDERS.find(p => p.provider === provider);
            if (isNil(providerMetadata)) {
                return {};
            }

            if (modelType === 'image') {
                if (provider === 'openai') {
                    return {
                        quality: Property.StaticDropdown({
                            options: {
                                options: [
                                    { label: 'Standard', value: 'standard' },
                                    { label: 'HD', value: 'hd' },
                                ],
                                disabled: false,
                                placeholder: 'Select Image Quality',
                            },
                            defaultValue: 'standard',
                            description:
                                'Standard images are less detailed and faster to generate, while HD images are more detailed but slower to generate.',
                            displayName: 'Image Quality',
                            required: true,
                        }),
                    };
                }

                if (provider === 'replicate') {
                    return {
                        negativePrompt: Property.ShortText({
                            displayName: 'Negative Prompt',
                            required: true,
                            description: 'A prompt to avoid in the generated image.',
                          }),
                    };
                }
            }

            return {};
        },
    })
})


type AIPropsParams<T extends 'language' | 'image'> = {
    modelType: T,
    functionCalling?: T extends 'image' ? never : boolean
}

type AIPropsReturn = {
    provider: ReturnType<typeof Property.Dropdown<string, true>>;
    model: ReturnType<typeof Property.Dropdown>;
    advancedOptions: ReturnType<typeof Property.DynamicProperties>;
}
