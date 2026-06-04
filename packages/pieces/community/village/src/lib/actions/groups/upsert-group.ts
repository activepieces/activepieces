import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const upsertGroup = createAction({
  auth: villageAuth,
  name: 'upsert_group',
  displayName: 'Create or Update Group',
  description:
    'Create a new group or update an existing one. To create: provide a name (id is auto-generated). To update: provide group_id (requires admin permissions).',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Group name (max 100 characters)',
      required: true,
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'Existing group ID to update. Omit to create a new group.',
      required: false,
    }),
    logo: Property.ShortText({
      displayName: 'Logo',
      description: 'URL to the group logo image',
      required: false,
    }),
  },
  async run(context) {
    const { name, group_id, logo } = context.propsValue;

    const body: Record<string, unknown> = { name };
    if (group_id !== undefined) body['group_id'] = group_id;
    if (logo !== undefined) body['logo'] = logo;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/groups`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});
