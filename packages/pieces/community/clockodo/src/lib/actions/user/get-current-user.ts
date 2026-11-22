import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Retrieves the Clockodo user of this connection',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: {
    description:
      'Returns the Clockodo user that owns this connection (id, name, e-mail, role, team). Use it to learn your own user id before creating entries or absences for yourself. Read-only and idempotent; takes no input.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return makeClient(auth.props).getCurrentUser();
  },
});
