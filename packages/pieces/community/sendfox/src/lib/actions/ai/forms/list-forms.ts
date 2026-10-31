import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListFormsOutputSchema } from '../../../output-schemas';

export const listFormsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_forms',
  outputSchema: sendfoxListFormsOutputSchema,
  displayName: 'List Forms',
  description: 'List the signup forms in your SendFox account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of signup forms with their IDs, titles, URLs and the lists they add contacts to. Optionally filters by a search term. Use it to find a form ID for Get Form.',
    idempotent: true,
  },
  props: {
    query: sendfoxAiProps.query({ required: false, description: 'Text to filter forms by title. Leave empty to return all forms.' }),
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/forms',
      query: {
        ...(propsValue.query ? { query: propsValue.query } : {}),
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
