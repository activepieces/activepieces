import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsOperations } from '../common/operations';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';

export const updateObjectAction = createAction({
  name: 'update_object',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Update Object',
  description: 'Changes some fields of an object and keeps the others.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates only the given fields of an existing Total CMS object and keeps all other fields as stored. Use Create Object for new objects and Duplicate Object to copy one under a new ID. Sending the same values again changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.object(),
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
