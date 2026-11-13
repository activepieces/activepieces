import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListListsOutputSchema } from '../../../output-schemas';

export const listListsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_lists',
  outputSchema: sendfoxListListsOutputSchema,
  displayName: 'List Lists',
  description: 'List the contact lists in your SendFox account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of contact lists with their IDs, names and subscriber counts. Use it to find a list ID for Get List or Add Contact to List. Optionally filters by a search term.',
    idempotent: true,
  },
  props: {
    query: sendfoxAiProps.query({ required: false, description: 'Text to filter lists by name. Leave empty to return all lists.' }),
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/lists',
      query: {
        ...(propsValue.query ? { query: propsValue.query } : {}),
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
