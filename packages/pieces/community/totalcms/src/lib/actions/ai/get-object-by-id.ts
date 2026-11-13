import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsApi } from '../../common/client';
import { totalcmsProps } from '../../common/props';
import { totalcmsShape } from '../../common/shape';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const getObjectByIdAction = createAction({
  name: 'get_object_by_id',
  classification: 'READ',
  auth: cmsAuth,
  displayName: 'Get Object (by ID)',
  description: 'Gets one object by collection ID and object ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Total CMS object with all its fields, given the collection ID (from List Collections) and object ID (from Find Objects (by Collection ID)). Use it to fetch long fields such as blog content, which Find Objects leaves out. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
    object_id: totalcmsProps.objectIdText(),
  },
  outputSchema: totalcmsOutputSchemas.object,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const object = await totalcmsApi.getObject({ auth: context.auth, collection, id });
    return totalcmsShape.generic({ collection, object });
  },
});
