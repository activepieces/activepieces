import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskSearchMacrosOutputSchema } from '../../../output-schemas';

export const zendeskSearchMacros = createAction({
  auth: zendeskAuth,
  name: 'zendesk_search_macros',
  outputSchema: zendeskSearchMacrosOutputSchema,
  displayName: 'Search Macros',
  description: 'Search macros by title.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds macros whose title matches the query. Use the returned macro ID with Get Macro or Preview Macro on Ticket.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Text to match against macro titles.', required: true }),
    active: Property.StaticDropdown({
      displayName: 'Active',
      description: 'Filter by active (Yes) or inactive (No). Omit for both.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
    limit: zendeskAiProps.limit(),
    page: zendeskAiProps.page(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ macros: unknown[]; next_page?: string | null }>({
      auth,
      method: HttpMethod.GET,
      path: `/macros/search.json`,
      queryParams: {
        ...zendeskApi.offsetQuery({ limit: propsValue.limit, page: propsValue.page }),
        ...zendeskApi.query({ query: propsValue.query, active: propsValue.active }),
      },
    });
    return {
      macros: response.macros,
      count: response.macros.length,
      ...zendeskApi.offsetResult({ nextPage: response.next_page, page: propsValue.page }),
    };
  },
});
