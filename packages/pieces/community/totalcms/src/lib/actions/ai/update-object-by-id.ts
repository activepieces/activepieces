import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsOperations } from '../../common/operations';
import { totalcmsProps } from '../../common/props';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const updateObjectByIdAction = createAction({
  name: 'update_object_by_id',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Update Object (by ID)',
  description: 'Changes some fields of an object, given the collection ID and object ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the given fields of an existing Total CMS object, given the collection ID (from List Collections) and object ID (from Find Objects (by Collection ID)); other fields stay as stored. Get field names from Get Collection Fields (by ID). Fails if the object does not exist. Sending the same values again changes nothing.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
    object_id: totalcmsProps.objectIdText(),
    fields: totalcmsOperations.updateFieldsProp(),
  },
  outputSchema: totalcmsOutputSchemas.object,
  async run(context) {
    return totalcmsOperations.updateObject({
      auth: context.auth,
      collection: context.propsValue.collection,
      objectId: context.propsValue.object_id,
      fields: context.propsValue.fields,
    });
  },
});
