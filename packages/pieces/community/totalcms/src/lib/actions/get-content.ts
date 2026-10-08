import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const getContentAction = createAction({
  name: 'get_content',
  classification: 'READ',
  auth: cmsAuth,
  displayName: 'Get Object',
  description: 'Gets one object (all its fields) from a collection.',
  audience: 'human',
  aiMetadata: {
    description:
      'Reads one Total CMS object with all its fields, given the collection and the object ID. Use it to fetch full content (Find Objects only returns index fields). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.object(),
  },
  outputSchema: totalcmsOutputSchemas.object,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object' });
    const object = await totalcmsApi.getObject({ auth: context.auth, collection, id });
    return totalcmsShape.generic({ collection, object });
  },
});
