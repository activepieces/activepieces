import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListOrganizationUsersOutputSchema } from '../../../output-schemas';

export const zendeskListOrganizationUsers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_organization_users',
  outputSchema: zendeskListOrganizationUsersOutputSchema,
  displayName: 'List Organization Users',
  description: 'List the users in an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the users that belong to one organization, optionally only one role. Use List Organization Memberships for the membership records and their IDs.',
    idempotent: true,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({ displayName: 'Organization ID', description: 'Numeric organization ID, from Search Organizations or List Organizations.' }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Only return users with this role.',
      required: false,
      options: { options: [{ label: 'End user', value: 'end-user' }, { label: 'Agent', value: 'agent' }, { label: 'Admin', value: 'admin' }] },
    }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    const response = await zendeskApi.request<{ users: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/organizations/${organizationId}/users.json`,
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...zendeskApi.query({ role: propsValue.role }),
      },
    });
    return {
      users: response.users,
      count: response.users.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
