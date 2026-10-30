import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const deleteObjectAction = createAction({
  name: 'delete_object',
  classification: 'DESTRUCTIVE',
  auth: cmsAuth,
  displayName: 'Delete Object',
  description: 'Permanently deletes an object and its files.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes one Total CMS object, including its uploaded files. This cannot be undone; a second call fails because the object is gone.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.object({ description: 'The object to delete. This cannot be undone.' }),
  },
  outputSchema: totalcmsOutputSchemas.deleted,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object' });
    const existing = await totalcmsApi.findObject({ auth: context.auth, collection, id });
    if (!existing) {
      throw new Error(`Object "${id}" was not found in collection "${collection}". It may already be deleted.`);
    }
    await totalcmsApi.deleteObject({ auth: context.auth, collection, id });
    return { deleted: true, collection, id };
  },
});
