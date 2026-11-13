import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskSearchAutomationsOutputSchema } from '../../../output-schemas';

export const zendeskSearchAutomations = createAction({
  auth: zendeskAuth,
  name: 'zendesk_search_automations',
  outputSchema: zendeskSearchAutomationsOutputSchema,
  displayName: 'Search Automations',
  description: 'Search automations by title.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds automations whose title matches the query. Requires an admin.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Text to match against automation titles.', required: true }),
    active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Filter by active (Yes) or inactive (No). Omit for both.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ automations: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/automations/search.json`,
      queryParams: zendeskApi.query({ query: propsValue.query, active: propsValue.active }),
    });
    return { automations: response.automations, count: response.automations.length };
  },
});
