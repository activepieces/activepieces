import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient } from '../../common/client';
import { asanaCurrentUserOutputSchema } from '../../output-schemas';

export const asanaGetCurrentUserAction = createAction({
  auth: asanaAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the Asana user behind this connection.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected Asana user (gid, name, email) and the workspaces they belong to. Call it first to learn your own user gid and the workspace gids other actions need; "me" also works wherever a user is expected. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaCurrentUserOutputSchema,
  props: {},
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/users/me',
      operation: 'Get Current User',
      query: { opt_fields: ASANA_FIELDS.user },
    });
  },
});
