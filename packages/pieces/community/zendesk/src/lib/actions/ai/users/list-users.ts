import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListUsersOutputSchema } from '../../../output-schemas';

export const zendeskListUsers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_users',
  outputSchema: zendeskListUsersOutputSchema,
  displayName: 'List Users',
  description: 'List users, optionally by role.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists users one page at a time, optionally only end users, agents or admins (e.g. role agent to find assignees). Use Search Users to look up a user by email, name or other attribute.',
    idempotent: true,
  },
  props: {
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Only return users with this role.',
      required: false,
      options: { options: [{ label: 'End user', value: 'end-user' }, { label: 'Agent', value: 'agent' }, { label: 'Admin', value: 'admin' }] },
    }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Only return users with this external ID.', required: false }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ users: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/users.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ role: propsValue.role, external_id: propsValue.external_id }),
      },
    });
    return {
      users: response.users,
      count: response.users.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
