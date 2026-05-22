import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bochaAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { freshnessDropdown, countProp } from '../common/props';

export const webSearchAction = createAction({
  name: 'web_search',
  displayName: 'Web Search',
  description: 'Search the web using Bocha.',
  auth: bochaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query.',
      required: true,
    }),
    freshness: freshnessDropdown,
    summary: Property.Checkbox({
      displayName: 'Show Summary',
      description: 'Include a text summary for each search result.',
      required: false,
      defaultValue: true,
    }),
    include: Property.ShortText({
      displayName: 'Include Domains',
      description: 'Limit search to specific domains. Separate multiple domains with | or , (max 100).',
      required: false,
    }),
    exclude: Property.ShortText({
      displayName: 'Exclude Domains',
      description: 'Exclude specific domains from search results. Separate multiple domains with | or , (max 100).',
      required: false,
    }),
    count: countProp,
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      query: propsValue['query'],
      count: propsValue['count'],
    };
    if (propsValue['freshness']) {
      body['freshness'] = propsValue['freshness'];
    }
    if (propsValue['summary'] !== undefined && propsValue['summary'] !== null) {
      body['summary'] = propsValue['summary'];
    }
    if (propsValue['include']) {
      body['include'] = propsValue['include'];
    }
    if (propsValue['exclude']) {
      body['exclude'] = propsValue['exclude'];
    }

    return makeRequest({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/web-search',
      body,
    });
  },
});
