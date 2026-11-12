import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListUserIdentitiesOutputSchema } from '../../../output-schemas';

export const zendeskListUserIdentities = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_user_identities',
  outputSchema: zendeskListUserIdentitiesOutputSchema,
  displayName: 'List User Identities',
  description: 'List the emails, phones and other identities of a user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the identities of one user: email addresses, phone numbers and social accounts, with which is primary and verified. Identity IDs feed Update User Identity, Make User Identity Primary and Delete User Identity.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const response = await zendeskApi.request<{ identities: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/users/${userId}/identities.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      identities: response.identities,
      count: response.identities.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
