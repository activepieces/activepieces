import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsOperations } from '../../common/operations';
import { totalcmsProps } from '../../common/props';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const cloneObjectByIdAction = createAction({
  name: 'clone_object_by_id',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Duplicate Object (by ID)',
  description: 'Copies an object under a new ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Copies a Total CMS object, given the collection ID and object ID, with its fields and files, to a new ID in the same collection. Use it to start new content from a template. Fails if the new ID already exists, so a retry does not create a second copy.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
    object_id: totalcmsProps.objectIdText(),
    new_id: totalcmsOperations.newIdProp(),
  },
  outputSchema: totalcmsOutputSchemas.object,
  async run(context) {
    return totalcmsOperations.cloneObject({
      auth: context.auth,
      collection: context.propsValue.collection,
      objectId: context.propsValue.object_id,
      newId: context.propsValue.new_id,
    });
  },
});
