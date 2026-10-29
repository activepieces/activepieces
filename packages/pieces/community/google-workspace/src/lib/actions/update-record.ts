import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { googleWorkspaceApi } from '../common/api';
import { googleWorkspaceClient } from '../common/client';
import { googleWorkspaceProps } from '../common/props';
import { googleWorkspaceUtils } from '../common/utils';
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
    resourceType: googleWorkspaceProps.resourceType({ verb: 'update' }),
    identifier: googleWorkspaceProps.identifier({ required: true }),
    parent: googleWorkspaceProps.parent({ required: false }),
    recordFields: googleWorkspaceProps.recordFields({ required: false, mode: 'update' }),
    record: googleWorkspaceProps.record({ required: false }),
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { resourceType, identifier, parent, recordFields, record } = context.propsValue;
    const def = googleWorkspaceUtils.resourceDefinition(resourceType);
    googleWorkspaceUtils.assertVerb({ def, verb: 'update' });
    const body = googleWorkspaceUtils.recordBody({ def, fields: recordFields, extra: record });
    if (Object.keys(body).length === 0) {
      throw new Error('The record has no fields to update.');
    }
    const auth = await googleWorkspaceClient.resolveAuth(context.auth);

    const updated = await googleWorkspaceClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.PATCH,
      path: def.itemPath({
        id: await googleWorkspaceApi.resolveIdentifier({ def, auth, id: identifier }),
        parent,
      }),
      body,
    });

    return {
      resourceType: def.type,
      id: googleWorkspaceUtils.idOf({ def, item: updated }),
      record: updated,
    };
  },
});
