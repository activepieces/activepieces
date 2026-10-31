import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListContactFieldsOutputSchema } from '../../../output-schemas';

export const listContactFieldsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_contact_fields',
  outputSchema: sendfoxListContactFieldsOutputSchema,
  displayName: 'List Contact Fields',
  description: 'List the custom contact fields in your SendFox account',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of custom contact fields with their IDs, labels, names and types (text, number or date). Use the names as `contactFields` in Create Contact.',
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
      path: '/contact-fields',
      query: {
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
      },
    });
  },
});
