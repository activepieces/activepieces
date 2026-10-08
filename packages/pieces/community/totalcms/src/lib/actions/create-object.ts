import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsOperations } from '../common/operations';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';

export const createObjectAction = createAction({
  name: 'create_object',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Create Object',
  description: 'Creates a new object in any collection.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new object in a Total CMS collection from a JSON object of field values (get the field names from Get Collection Fields). Fails if the ID already exists; leave the ID empty to let Total CMS make one from the title when the schema allows it. Each call creates a new object.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.objectIdText({
      description: 'The ID (URL slug) for the new object. Leave empty to let Total CMS generate it, when the collection supports that.',
      required: false,
    }),
    fields: totalcmsOperations.createFieldsProp(),
  },
  outputSchema: totalcmsOutputSchemas.object,
  async run(context) {
    return totalcmsOperations.createObject({
      auth: context.auth,
      collection: context.propsValue.collection,
      objectId: context.propsValue.object_id,
      fields: context.propsValue.fields,
    });
  },
});
