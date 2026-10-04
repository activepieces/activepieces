import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListUserFieldsOutputSchema } from '../../../output-schemas';

export const zendeskListUserFields = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_user_fields',
  outputSchema: zendeskListUserFieldsOutputSchema,
  displayName: 'List User Fields',
  description: 'List the custom user fields.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists custom user fields with their keys, types and options, for user_fields on Create User and Update User.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ user_fields: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/user_fields.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      user_fields: response.user_fields,
      count: response.user_fields.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
