import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatUsers } from '../common/users';

export const findUserByEmailAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_find_user_by_email',
  classification: 'READ',
  displayName: 'Find Member by Email',
  description: 'Looks up a member by exact email address.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up one member by exact email and returns found=false (not an error) when nobody in the community has it. Use before Create Member to avoid duplicates, or to get a member ID for messaging and groups. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.findUser,
  async run({ auth, propsValue }) {
    const user = await heartbeatUsers.findUserByEmail({
      token: auth.secret_text,
      email: heartbeatApi.email({ value: propsValue.email, label: 'Email' }),
    });
    return { found: user !== null, user };
  },
});
