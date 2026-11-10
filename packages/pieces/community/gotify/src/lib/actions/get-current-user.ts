import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const getCurrentUser = createAction({
  auth: gotifyAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the Gotify user of the Client Token.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the Gotify user that owns the connection\'s Client Token (id, name, admin flag). Needs the Client Token. Read-only.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.currentUser,
  props: {},
  async run({ auth }) {
    return gotifyClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/current/user', tokenKind: 'client' });
  },
});
