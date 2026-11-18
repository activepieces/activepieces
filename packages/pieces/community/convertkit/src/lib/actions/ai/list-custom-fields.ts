import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { CustomField } from '../../common/types';
import { kitListCustomFieldsOutputSchema } from '../../output-schemas';

export const kitListCustomFields = createAction({
  auth: convertkitAuth,
  name: 'kit_list_custom_fields',
  classification: 'SEARCH',
  outputSchema: kitListCustomFieldsOutputSchema,
  displayName: 'List Custom Fields',
  description: 'List the custom subscriber fields defined on the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every custom field with its ID, label and key. Use the key when setting Custom Fields on subscribers, and the ID for Update or Delete Custom Field.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await kitClient.request<{ custom_fields: CustomField[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/custom_fields',
    });
    const customFields = response.body.custom_fields ?? [];
    return { custom_fields: customFields, count: customFields.length };
  },
});
