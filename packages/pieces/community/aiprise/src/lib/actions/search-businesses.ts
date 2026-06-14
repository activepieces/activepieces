import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const searchBusinessesAction = createAction({
  auth: aipriseAuth,
  name: 'search_businesses',
  displayName: 'Search Businesses',
  description:
    'Searches public business registries by name and country, returning a list of matching companies with their entity IDs, types, and addresses. Useful for looking up a business before creating a profile or running a verification.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches public business registries by company name and country (optionally narrowed by state/province), returning matching companies with their registry entity IDs, types, and addresses. Use this to look up and identify a real-world business before creating a profile or running a verification. Requires a business name and a 2-letter country code; partial name matches are supported. Read-only and idempotent.',
    idempotent: true,
  },
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
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/data/business/search',
      body,
    });
  },
});
