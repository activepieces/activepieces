import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkObjectFields } from '../../common/object-fields';
import { folkOutputSchemas } from '../../output-schemas';

export const deleteGroupObject = createAction({
  auth: folkAuth,
  name: 'delete_group_object',
  displayName: 'Delete Group Object (Deal)',
  description: 'Delete an object, such as a deal, from a Folk group.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: folkOutputSchemas.deletedObject,
  aiMetadata: {
    description:
      'Permanently deletes one Folk group object (for example a deal) by ID. Cannot be undone; confirm the ID with List Group Objects first. A second call fails with not found.',
    idempotent: false,
  },
  props: {
    ...folkObjectFields.objectProps(),
    objectId: folkAi.idProp({ displayName: 'Object ID', description: 'ID of the object to delete (obj_...).' }),
  },
  async run(context) {
    const p = context.propsValue;
    const base = folkObjectFields.objectPath({ groupId: p.groupId, objectType: p.objectType });
    const id = folkClient.idSegment({ value: p.objectId, label: 'Object ID' });
    return folkAi.deleteRecord({ auth: context.auth, path: `${base}/${id}`, id });
  },
});
