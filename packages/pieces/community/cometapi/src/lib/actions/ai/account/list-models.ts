import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiUtils } from '../../../common/utils';
import { cometApiClient } from '../../../common/client';
import type { CometApiCatalogModel } from '../../../common/types';
import { cometapiListModelsOutputSchema } from '../../../output-schemas';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

const FEATURES = [
  'text-to-text',
  'image-to-text',
  'pdf-to-text',
  'text-to-image',
  'image-to-image',
  'image-editing',
  'text-to-video',
  'image-to-video',
  'video-to-text',
  'video-editing',
  'video-to-audio',
  'speech-to-text',
  'text-to-speech',
];

export const listModelsAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_list_models',
  outputSchema: cometapiListModelsOutputSchema,
  displayName: 'List Models',
  description:
    'Lists models in the CometAPI catalog, with their capabilities and pricing.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Searches the CometAPI model catalog and returns each model's ID (the value every generation action takes as Model), provider, type, features, endpoints and pricing. Filter by feature (e.g. text-to-video), provider or a search term to keep the result short. Free to call.",
    idempotent: true,
  },
  props: {
    feature: Property.StaticDropdown({
      displayName: 'Feature',
      description: 'Only models with this capability.',
      required: false,
      options: {
        options: cometApiUtils.toOptions({ values: FEATURES }),
      },
    }),
    provider: Property.ShortText({
      displayName: 'Provider',
      description:
        'Only models from this provider code, e.g. "openai", "anthropic", "google", "kling".',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'Case-insensitive text matched against the model ID and name.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Maximum models to return (1-${MAX_LIMIT}). Defaults to ${DEFAULT_LIMIT}.`,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { feature, provider, search } = propsValue;
    const limit = Math.min(
      Math.max(propsValue.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const response = await cometApiClient.request<{
      success: boolean;
      total?: number;
      data: CometApiCatalogModel[];
    }>({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: '/api/models',
    });
    const needle = search?.toLowerCase();
    const matches = response.data.filter(
      (model) =>
        (!feature || (model.features ?? []).includes(feature)) &&
        (!provider || model.provider_code === provider) &&
        (!needle ||
          model.id.toLowerCase().includes(needle) ||
          (model.name ?? '').toLowerCase().includes(needle))
    );
    const models = matches.slice(0, limit);
    return { models, count: models.length, total: matches.length };
  },
});
