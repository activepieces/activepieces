import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { GoogleWorkspaceApi } from '../common/client';
import { parentProp, parseRecord, recordJsonProp, resourceTypeProp } from '../common/records';
import { assertVerb, idOf, resourceDefinition } from '../common/resources';
import { resolveAuth } from '../common/token';
import { recordOutputSchema } from '../output-schemas';

export const addRecord = createAction({
  name: 'addRecord',
  classification: 'WRITE',
  displayName: 'Add Record',
  description: 'Create a user, group, group member, organizational unit or role assignment',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one Google Workspace directory record (user, group, group member, organizational unit or role assignment) from a JSON body in the Admin SDK Directory API shape. Use to provision a new entry; to change an existing one use Update Record. Each call creates a new record, so a retry fails with a conflict or creates a duplicate.',
    idempotent: false,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceType: resourceTypeProp,
    parent: parentProp,
    record: recordJsonProp,
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { resourceType, parent, record } = context.propsValue;
    const def = resourceDefinition(resourceType);
    assertVerb({ def, verb: 'create' });
    const body = parseRecord(record);
    const auth = await resolveAuth(context.auth);

    const created = await GoogleWorkspaceApi.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: def.collectionPath(parent),
      body,
    });

    return { resourceType: def.type, id: idOf({ def, item: created }), record: created };
  },
});
