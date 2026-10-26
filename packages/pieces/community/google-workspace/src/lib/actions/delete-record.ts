import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { googleWorkspaceApi } from '../common/api';
import { googleWorkspaceClient } from '../common/client';
import { googleWorkspaceProps } from '../common/props';
import { googleWorkspaceUtils } from '../common/utils';
import { deleteRecordOutputSchema } from '../output-schemas';

export const deleteRecord = createAction({
  name: 'deleteRecord',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description:
    'Remove a user, group, group member, organizational unit, mobile device or role assignment. Deleted users can be restored for 20 days from the Admin console; everything else is permanent.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes one Google Workspace directory record (user, group, group member, organizational unit, mobile device or role assignment). Prefer Suspend User to block a user without losing data. Only deleted users can be restored (for 20 days, from the Admin console); a retry after success fails with not found.',
    idempotent: false,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceType: googleWorkspaceProps.resourceType({ verb: 'delete' }),
    identifier: googleWorkspaceProps.identifier({ required: true }),
    parent: googleWorkspaceProps.parent({ required: false }),
  },
  outputSchema: deleteRecordOutputSchema,
  async run(context) {
    const { resourceType, identifier, parent } = context.propsValue;
    const def = googleWorkspaceUtils.resourceDefinition(resourceType);
    googleWorkspaceUtils.assertVerb({ def, verb: 'delete' });
    const auth = await googleWorkspaceClient.resolveAuth(context.auth);

    await googleWorkspaceClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: def.itemPath({
        id: await googleWorkspaceApi.resolveIdentifier({ def, auth, id: identifier }),
        parent,
      }),
    });

    return { resourceType: def.type, id: String(identifier).trim(), removed: true };
  },
});
