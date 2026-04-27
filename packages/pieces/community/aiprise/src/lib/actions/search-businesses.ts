import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const searchBusinessesAction = createAction({
  auth: aipriseAuth,
  name: 'search_businesses',
  displayName: 'Search Businesses',
  description:
    'Searches public business registries by name and country, returning a list of matching companies with their entity IDs, types, and addresses. Useful for looking up a business before creating a profile or running a verification.',
  props: {
    name: Property.ShortText({
      displayName: 'Business Name',
      description: 'The business name to search for. Partial matches are supported by AiPrise.',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: '2-letter ISO country code where the business is registered (e.g. US, GB).',
      required: true,
    }),
    state_code: Property.ShortText({
      displayName: 'State/Province Code',
      description:
        'Optional state or province code to narrow the search (e.g. CA, NY for the US). Leave empty to search the whole country.',
      required: false,
    }),
  },
  async run(context) {
    const { name, country_code, state_code } = context.propsValue;

    const body: Record<string, unknown> = {
      name,
      country_code,
    };
    if (state_code) body['state_code'] = state_code;

    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/data/business/search',
      body,
    });
  },
});
