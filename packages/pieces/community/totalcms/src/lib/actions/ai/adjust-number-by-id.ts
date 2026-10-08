import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsOperations } from '../../common/operations';
import { totalcmsProps } from '../../common/props';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const adjustNumberByIdAction = createAction({
  name: 'adjust_number_by_id',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Increase or Decrease Number (by ID)',
  description: 'Adds to or subtracts from a number field, such as a counter or stock level.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds to or subtracts from a number field of a Total CMS object, given the collection ID, object ID and field name, for counters such as views, votes or stock. Use Update Object (by ID) to set an exact value. Every call changes the number again, so retries double count.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
    object_id: totalcmsProps.objectIdText(),
    field: Property.ShortText({
      displayName: 'Field Name',
      description: 'The name of the number field, for example views.',
      required: true,
    }),
    ...totalcmsOperations.adjustProps(),
  },
  outputSchema: totalcmsOutputSchemas.number,
  async run(context) {
    return totalcmsOperations.adjustNumber({ auth: context.auth, input: context.propsValue });
  },
});
