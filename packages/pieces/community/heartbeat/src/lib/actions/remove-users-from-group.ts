import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const removeUsersFromGroupAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_remove_users_from_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Members from Group',
  description: 'Removes members from a group by email. They stay in the community.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes members (by email) from a group; they stay in the community and keep their other groups. Use for offboarding from a cohort or stage. Removing someone who is not in the group changes nothing, so it is idempotent.',
    idempotent: true,
  },
  props: {
    groupId: heartbeatProps.id({ displayName: 'Group ID', description: 'Use List Groups to find the ID.', required: true }),
    emails: heartbeatProps.emails({ displayName: 'Member Emails', description: '1-100 member emails.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.groupRemoval,
  async run({ auth, propsValue }) {
    const groupId = heartbeatApi.uuid({ value: propsValue.groupId, label: 'Group ID' });
    const emails = heartbeatApi.emailList({ value: propsValue.emails, label: 'Member Emails', min: 1 });
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/groups/${groupId}/memberships`,
      operation: 'remove members from group',
      body: { emails },
    });
    return { groupId, emails, removed: true };
  },
});
