import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaCurrentUserOutputSchema } from '../../output-schemas';

export const asanaGetUserAction = createAction({
  auth: asanaAuth,
  name: 'get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Get an Asana user by gid or email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one user (gid, name, email) and the workspaces they share with the connected user. Accepts "me", an email address or a user gid, so it also turns an email into a gid. Use Get Current User for yourself and List Users to browse a workspace or team. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaCurrentUserOutputSchema,
  props: {
    user: Property.ShortText({
      displayName: 'User',
      description: 'User to look up: "me", an email address or a user gid. Obtain gids from List Users or Search Workspace Objects (object type user).',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${asanaUtils.pathSegment(context.propsValue.user)}`,
      operation: 'Get User',
      query: { opt_fields: ASANA_FIELDS.user },
    });
  },
});
