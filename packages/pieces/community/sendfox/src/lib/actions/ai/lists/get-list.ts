import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetListOutputSchema } from '../../../output-schemas';

export const getListAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_list',
  outputSchema: sendfoxGetListOutputSchema,
  displayName: 'Get List',
  description: 'Get one SendFox contact list',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one contact list by ID with its name, subscriber and unsubscriber counts and average open and click rates. List IDs come from List Lists.',
    idempotent: true,
  },
  props: {
    listId: sendfoxAiProps.listId({ required: true }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/lists/${encodeURIComponent(propsValue.listId)}`,
    });
  },
});
