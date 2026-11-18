import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripOutputSchemas } from '../output-schemas';

export const getCurrentUserAction = createAction({
  auth: dripAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Gets the Drip user who owns the API token.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the email, name and time zone of the Drip user who owns the connected API token. Use to confirm which Drip login the connection belongs to. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: dripOutputSchemas.user,
  async run({ auth }) {
    const body = await dripApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/user', operation: 'get current user' });
    return dripApi.firstRecord({ body, key: 'users', operation: 'get current user' });
  },
});
