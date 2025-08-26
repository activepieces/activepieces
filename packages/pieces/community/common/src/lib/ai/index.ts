import { isNil, SeekPage, AIProviderWithoutSensitiveData, SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared';
import { Property, InputPropertyMap } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '../http';
import { ImageModel } from 'ai';

export const aiProps = <T extends ModelType>({ modelType, functionCalling }: AIPropsParams<T>): AIPropsReturn => ({
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
                } else if (modelType === 'transcription') {
                    if (provider.transcriptionModels.length === 0 && provider.provider !== 'google') return null;
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

            const allModels = getModelsByType(modelType, supportedProvider);
            
            const models = modelType === 'language' && functionCalling
                ? allModels.filter(model => 
                    hasLanguageModelWithFunctionCalling(model) && model.functionCalling
                  )
                : allModels;

            return {
                placeholder: 'Select AI Model',
                disabled: false,
                options: models.map((model: AnyModel) => ({
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
            }

            return options;
        },
    })
})

const getModelsByType = (type: ModelType, supportedProvider: SupportedAIProvider): AnyModel[] => {
    switch (type) {
        case 'language':
            return supportedProvider.languageModels;
        case 'image':
            return supportedProvider.imageModels;
        case 'transcription':
            // Special case: Google uses language models for transcription
            return supportedProvider.provider === 'google' 
                ? supportedProvider.languageModels 
                : supportedProvider.transcriptionModels;
        default:
            return [];
    }
};

const hasLanguageModelWithFunctionCalling = (model: AnyModel): model is SupportedAIProvider['languageModels'][number] => {
    return 'functionCalling' in model && model.functionCalling;
};

type AIPropsParams<T extends ModelType> = {
    modelType: T,
    functionCalling?: T extends 'language' ? boolean : never
}

type AIPropsReturn = {
    provider: ReturnType<typeof Property.Dropdown<string, true>>;
    model: ReturnType<typeof Property.Dropdown>;
    advancedOptions: ReturnType<typeof Property.DynamicProperties>;
}

type AnyModel = SupportedAIProvider['languageModels'][number] | 
               SupportedAIProvider['imageModels'][number] | 
               SupportedAIProvider['transcriptionModels'][number];

type ModelType = 'language' | 'image' | 'transcription';