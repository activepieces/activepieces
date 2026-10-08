import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatUsers } from '../common/users';

export const getUserAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_get_user',
  classification: 'READ',
  displayName: 'Get Member',
  description: 'Gets one member by user ID, including profile details.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one member by user ID with email, role, groups, bio, social links, LinkedIn data and onboarding answers. Use when you have the ID (from List Members or a trigger); use Find Member by Email when you only have the email. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    userId: heartbeatProps.id({ displayName: 'User ID', description: 'Use List Members to find the ID.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.user,
  async run({ auth, propsValue }) {
    return heartbeatUsers.getUser({ token: auth.secret_text, userId: heartbeatApi.uuid({ value: propsValue.userId, label: 'User ID' }) });
  },
});
