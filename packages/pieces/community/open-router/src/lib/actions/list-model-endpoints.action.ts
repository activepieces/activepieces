import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { OpenRouterEndpoint, OpenRouterModel, mapOpenRouterEndpoint } from '../common';
import { listModelEndpointsActionOutputSchema } from '../output-schemas';

export const listModelEndpointsAction = createAction({
  audience: 'both',
  name: 'list_model_endpoints',
  classification: 'READ',
  auth: openRouterAuth,
  displayName: 'List Providers for a Model',
  description: 'Lists every provider serving a specific model, with the pricing and uptime each one offers.',
  aiMetadata: {
    description:
      "Lists every provider serving one model on OpenRouter, each with its own pricing, quantization, context length, and uptime. Use it to compare providers for a model discovered with List Models before pinning a request to one. Safe to retry: read-only.",
    idempotent: true,
  },
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'The model to list providers for.',
      required: true,
      refreshers: [],
      auth: openRouterAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const response = await httpClient.sendRequest<{ data: OpenRouterModel[] }>({
            url: 'https://openrouter.ai/api/v1/models',
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth.secret_text,
            },
          });
          return {
            disabled: false,
            options: response.body.data.map((model) => ({ label: model.id, value: model.id })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: `Couldn't load models:\n${error}`,
          };
        }
      },
    }),
  },
  outputSchema: listModelEndpointsActionOutputSchema,
  async run({ auth, propsValue }) {
    const [author, ...slugParts] = propsValue.model.split('/');
    const slug = slugParts.join('/');

    const response = await httpClient.sendRequest<{
      data: { id: string; name: string; endpoints: OpenRouterEndpoint[] };
    }>({
      url: `https://openrouter.ai/api/v1/models/${author}/${slug}/endpoints`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    const { id, name, endpoints } = response.body.data;

    return {
      id,
      name,
      endpoints: endpoints.map(mapOpenRouterEndpoint),
    };
  },
});
