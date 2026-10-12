import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const removeUserAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_remove_user',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Member (Deactivate)',
  description: 'Deactivates a member by email. Their threads, comments and messages stay; Reactivate Member undoes it.',
  audience: 'both',
  aiMetadata: {
    description: 'Deactivates a member by email so they can no longer access the community; their threads, comments and messages stay, and Reactivate Member undoes it. Use only when asked to remove someone. Fails if no member has that email. Repeating it on a deactivated member succeeds again, so it is idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Email of the member to deactivate.', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.removedUser,
  async run({ auth, propsValue }) {
    const email = heartbeatApi.email({ value: propsValue.email, label: 'Email' });
    await heartbeatApi.request({
      token: auth.secret_text,
      method: HttpMethod.DELETE,
      path: '/users',
      operation: 'remove member',
      body: { email },
    });
    return { email, removed: true };
  },
});
