import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const createPendingUserAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_pending_user',
  classification: 'WRITE',
  displayName: 'Pre-register Member',
  description: 'Pre-registers a person who becomes a member with this role and groups the first time they log in.',
  audience: 'both',
  aiMetadata: {
    description: 'Pre-registers a person by email with a role ID and optional group IDs; they become a member the first time they log in. Use when someone should get a set role and groups on their first login. Fails if the email is already a member. Calling again for the same pending email updates the pre-registration, so it is idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: "The person's full name.", required: true }),
    roleId: heartbeatProps.id({ displayName: 'Role ID', description: 'Use List Roles to find the ID.', required: true }),
    groupIds: heartbeatProps.ids({ displayName: 'Group IDs', description: 'Use List Groups to find IDs.', required: false }),
    bio: Property.LongText({ displayName: 'Bio', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.pendingUser,
  async run({ auth, propsValue }) {
    const email = heartbeatApi.email({ value: propsValue.email, label: 'Email' });
    const response = await heartbeatApi.request<unknown>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/pendingUser',
      operation: 'pre-register member',
      body: {
        email,
        name: heartbeatApi.requiredText({ value: propsValue.name, label: 'Name' }),
        roleID: heartbeatApi.uuid({ value: propsValue.roleId, label: 'Role ID' }),
        groupIDs: heartbeatApi.listOrUndefined(heartbeatApi.uuidList({ value: propsValue.groupIds, label: 'Group IDs' })),
        bio: heartbeatApi.optionalText(propsValue.bio),
      },
    });
    return { email, success: heartbeatApi.isRecord(response) ? response['success'] === true : true };
  },
});
