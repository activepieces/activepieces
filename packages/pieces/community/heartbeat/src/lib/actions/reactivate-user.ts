import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const reactivateUserAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_reactivate_user',
  classification: 'WRITE',
  displayName: 'Reactivate Member',
  description: 'Gives a deactivated member access to the community again.',
  audience: 'both',
  aiMetadata: {
    description: 'Restores community access for a member who was removed (deactivated), identified by email. Use to undo Remove Member. If the member is already active it reports alreadyActive=true instead of failing, so it is idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Email of the member to reactivate.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.reactivatedUser,
  async run({ auth, propsValue }) {
    const email = heartbeatApi.email({ value: propsValue.email, label: 'Email' });
    try {
      await heartbeatApi.request({
        token: auth.secret_text,
        method: HttpMethod.POST,
        path: '/users/reactivate',
        operation: 'reactivate member',
        body: { email },
      });
      return { email, reactivated: true, alreadyActive: false };
    } catch (error) {
      if (heartbeatApi.statusOf(error) === 400 && /already active/i.test(heartbeatApi.errorMessageOf(error))) {
        return { email, reactivated: true, alreadyActive: true };
      }
      throw error;
    }
  },
});
