import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsOperations } from '../common/operations';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';

export const getCollectionSchemaAction = createAction({
  name: 'get_collection_schema',
  classification: 'READ',
  auth: cmsAuth,
  displayName: 'Get Collection Fields',
  description: 'Lists the fields of a collection, with their types.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns the field list of a Total CMS collection (name, label, field type, data type, required, and whether Find Objects returns it). Call it before Create Object or Update Object to learn which field names to send. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collection(),
  },
  outputSchema: totalcmsOutputSchemas.schema,
  async run(context) {
    return totalcmsOperations.collectionFields({ auth: context.auth, collection: context.propsValue.collection });
  },
});
