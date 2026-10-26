import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { googleWorkspaceClient } from '../common/client';
import { googleWorkspaceProps } from '../common/props';
import { googleWorkspaceUtils } from '../common/utils';
import { recordOutputSchema } from '../output-schemas';

export const addRecord = createAction({
  name: 'addRecord',
  classification: 'WRITE',
  displayName: 'Add Record',
  description: 'Create a user, group, group member, organizational unit or role assignment',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one Google Workspace directory record (user, group, group member, organizational unit or role assignment) from the Fields of the chosen type and/or Extra Fields, a JSON body in the Admin SDK Directory API shape. Use to provision a new entry; to change an existing one use Update Record. Each call creates a new record, so a retry fails with a conflict or creates a duplicate.',
    idempotent: false,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceType: googleWorkspaceProps.resourceType({ verb: 'create' }),
    parent: googleWorkspaceProps.parent({ required: false }),
    recordFields: googleWorkspaceProps.recordFields({ required: false, mode: 'create' }),
    record: googleWorkspaceProps.record({ required: false }),
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { resourceType, parent, recordFields, record } = context.propsValue;
    const def = googleWorkspaceUtils.resourceDefinition(resourceType);
    googleWorkspaceUtils.assertVerb({ def, verb: 'create' });
    const body = googleWorkspaceUtils.recordBody({ def, fields: recordFields, extra: record });
    if (Object.keys(body).length === 0) {
      throw new Error('Fill in the Fields (or Extra Fields) of the new record.');
    }
    const auth = await googleWorkspaceClient.resolveAuth(context.auth);

    const created = await googleWorkspaceClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: def.collectionPath(parent),
      body,
    });

    return {
      resourceType: def.type,
      id: googleWorkspaceUtils.idOf({ def, item: created }),
      record: created,
    };
  },
});
