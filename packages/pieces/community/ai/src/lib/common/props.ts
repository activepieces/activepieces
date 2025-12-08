import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData } from './types';

export const aiProps = <T extends 'text' | 'image'>({ modelType, allowedProviders }: AIPropsParams<T>) => ({
    provider: Property.Dropdown<string, true>({
        auth: PieceAuth.None(),
        displayName: 'Provider',
        required: true,
        refreshers: [],
        options: async (_, ctx) => {
            const { body: supportedProviders } = await httpClient.sendRequest<AIProviderWithoutSensitiveData[]>({
                method: HttpMethod.GET,
                url: `${ctx.server.apiUrl}v1/ai-providers`,
                headers: {
                    Authorization: `Bearer ${ctx.server.token}`,
                },
            });

            const configured = supportedProviders.filter(supportedProvider => supportedProvider.configured);
            if (configured.length === 0) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'No AI providers configured by the admin.',
                };
            }

            return {
                placeholder: 'Select AI Provider',
                disabled: false,
                options: configured.map(supportedProvider => ({
                    label: supportedProvider.name,
                    value: supportedProvider.id,
                })).filter(provider => allowedProviders ? allowedProviders.includes(provider.value as AIProviderName) : true),
            };
        },
    }),
    model: Property.Dropdown({
        auth: PieceAuth.None(),
        displayName: 'Model',
        required: true,
        defaultValue: 'gpt-4o',
        refreshers: ['provider'],
        options: async (propsValue, ctx) => {
            const provider = propsValue['provider'] as string;
            if (isNil(provider)) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Select AI Provider',
                };
            }

            const { body: allModels } = await httpClient.sendRequest<AIProviderModel[]>({
                method: HttpMethod.GET,
                url: `${ctx.server.apiUrl}v1/ai-providers/${provider}/models`,
                headers: {
                    Authorization: `Bearer ${ctx.server.token}`,
                },
            });

            const models = allModels
                .filter(model => model.type === modelType)
                .filter(model => {
                    if (provider !== AIProviderName.ACTIVEPIECES) {
                        return true;
                    }
                    return Object.values([AIProviderName.OPENAI, AIProviderName.ANTHROPIC, AIProviderName.GOOGLE]).some(allowedProvider => model.id.toLowerCase().startsWith(allowedProvider.toLowerCase() + '/'));
                }).sort((a, b) => a.name.localeCompare(b.name));
            return {
                placeholder: 'Select AI Model',
                disabled: false,
                options: models.map(model => ({
                    label: model.name,
                    value: model.id,
                })),
            };
        },
    }),
})

type AIPropsParams<T extends 'text' | 'image'> = {
    modelType: T,
    allowedProviders?: AIProviderName[]
}

