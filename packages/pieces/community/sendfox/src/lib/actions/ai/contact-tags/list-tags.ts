import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListTagsOutputSchema } from '../../../output-schemas';

export const listTagsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_tags',
  outputSchema: sendfoxListTagsOutputSchema,
  displayName: 'List Tags',
  description: 'List the contact tags in your SendFox account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of contact tags with their IDs, names, colors and contact counts. Use it to find a tag ID for Get Tag or Add Tag to Contact.',
    idempotent: true,
  },
  props: {
    page: sendfoxAiProps.page({ required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/contact-tags',
      query: {
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
