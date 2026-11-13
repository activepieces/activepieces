import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsOperations } from '../common/operations';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';

export const cloneObjectAction = createAction({
  name: 'clone_object',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Duplicate Object',
  description: 'Copies an object under a new ID.',
  audience: 'human',
  aiMetadata: {
    description:
      'Copies an existing Total CMS object, with its fields and files, to a new ID in the same collection. Use it to start a new post or page from a template. Fails if the new ID already exists, so a retry does not create a second copy.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.object({ description: 'The object to copy.' }),
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
