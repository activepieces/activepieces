import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { GoogleWorkspaceApi } from '../common/client';
import { parentProp, parseRecord, recordIdentifierProp, recordJsonProp, resourceTypeProp } from '../common/records';
import { assertVerb, idOf, resourceDefinition, resolveIdentifier } from '../common/resources';
import { resolveAuth } from '../common/token';
import { recordOutputSchema } from '../output-schemas';

export const updateRecord = createAction({
  name: 'updateRecord',
  classification: 'WRITE',
  displayName: 'Update Record',
  description:
    'Change fields of a user, group, group member, organizational unit or Chrome OS device (PATCH: untouched fields stay as they are)',
  audience: 'both',
  aiMetadata: {
    description:
      'Partially updates one existing Google Workspace directory record (user, group, group member, organizational unit or Chrome OS device) with the given fields; omitted fields stay unchanged. Use Suspend User for suspensions and Add Record to create. Safe to retry: the record ends in the same state.',
    idempotent: true,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceType: resourceTypeProp,
    identifier: recordIdentifierProp,
    parent: parentProp,
    record: recordJsonProp,
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { resourceType, identifier, parent, record } = context.propsValue;
    const def = resourceDefinition(resourceType);
    assertVerb({ def, verb: 'update' });
    const body = parseRecord(record);
    if (Object.keys(body).length === 0) {
      throw new Error('The record has no fields to update.');
    }
    const auth = await resolveAuth(context.auth);

    const updated = await GoogleWorkspaceApi.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.PATCH,
      path: def.itemPath({ id: await resolveIdentifier({ def, auth, id: identifier }), parent }),
      body,
    });

    return { resourceType: def.type, id: idOf({ def, item: updated }), record: updated };
  },
});
