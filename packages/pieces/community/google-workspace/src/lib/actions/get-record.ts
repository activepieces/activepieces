import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { GoogleWorkspaceApi } from '../common/client';
import { parentProp, recordIdentifierProp, resourceTypeProp, stringValues } from '../common/records';
import { assertVerb, idOf, resourceDefinition, resolveIdentifier } from '../common/resources';
import { resolveAuth } from '../common/token';
import { recordOutputSchema } from '../output-schemas';

export const getRecord = createAction({
  name: 'getRecord',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Return the full record of a user, group, group member, org unit, device or role assignment',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Google Workspace directory record (user, group, group member, organizational unit, mobile or Chrome OS device, role assignment) by its identifier. Use when the key is known; to find records by criteria use Search Records. Read-only and safe to retry.',
    idempotent: true,
  },
  auth: googleWorkspaceAuth,
  props: {
    resourceType: resourceTypeProp({ verb: 'get' }),
    identifier: recordIdentifierProp,
    parent: parentProp,
    params: Property.Object({
      displayName: 'Extra Query Parameters',
      description:
        'Optional Directory API parameters for this collection, e.g. `projection: full` and `customFieldMask: Schema1` for users, `viewType: domain_public`.',
      required: false,
    }),
  },
  outputSchema: recordOutputSchema,
  async run(context) {
    const { resourceType, identifier, parent, params } = context.propsValue;
    const def = resourceDefinition(resourceType);
    assertVerb({ def, verb: 'get' });
    const auth = await resolveAuth(context.auth);

    const record = await GoogleWorkspaceApi.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: def.itemPath({ id: await resolveIdentifier({ def, auth, id: identifier }), parent }),
      query: stringValues(params),
    });

    return { resourceType: def.type, id: idOf({ def, item: record }), record };
  },
});
