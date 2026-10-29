import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsOperations } from '../../common/operations';
import { totalcmsProps } from '../../common/props';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const getCollectionFieldsByIdAction = createAction({
  name: 'get_collection_fields_by_id',
  classification: 'READ',
  auth: cmsAuth,
  displayName: 'Get Collection Fields (by ID)',
  description: 'Lists the fields of a collection, with their types.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the field list of a Total CMS collection, given its ID (from List Collections): name, label, field type, data type, required, and whether Find Objects returns it. Call it before Create Object (by ID) or Update Object (by ID) to learn the field names. Read-only.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
  },
  outputSchema: totalcmsOutputSchemas.schema,
  async run(context) {
    return totalcmsOperations.collectionFields({ auth: context.auth, collection: context.propsValue.collection });
  },
});
