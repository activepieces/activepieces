import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkObjectFields } from '../../common/object-fields';
import { folkOutputSchemas } from '../../output-schemas';

export const updateGroupObject = createAction({
  auth: folkAuth,
  name: 'update_group_object',
  displayName: 'Update Group Object (Deal)',
  description: 'Update an object, such as a deal, in a Folk group.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.object,
  aiMetadata: {
    description:
      'Updates a Folk group object (for example a deal) by ID. Only fields you give change; Person IDs and Company IDs replace the current links; Custom Field Values change only the named fields. Returns the updated object.',
    idempotent: false,
  },
  props: {
    ...folkObjectFields.objectProps(),
    objectId: folkAi.idProp({ displayName: 'Object ID', description: 'ID of the object to update (obj_...).' }),
    name: Property.ShortText({ displayName: 'Name', description: 'New name.', required: false }),
    ...folkObjectFields.objectBodyProps({ forUpdate: true }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = folkObjectFields.objectBody({ props: p });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update. Give at least one field.');
    }
    const base = folkObjectFields.objectPath({ groupId: p.groupId, objectType: p.objectType });
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `${base}/${folkClient.idSegment({ value: p.objectId, label: 'Object ID' })}`,
      body,
    });
  },
});
