import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsOperations } from '../common/operations';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';

export const adjustNumberAction = createAction({
  name: 'adjust_number',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Increase or Decrease Number',
  description: 'Adds to or subtracts from a number field, such as a counter or stock level.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds to or subtracts from a number field of a Total CMS object in one step, for counters such as views, votes or stock. Use Update Object to set an exact value instead. Every call changes the number again, so retries double count.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.object(),
    field: totalcmsProps.schemaField({
      displayName: 'Number Field',
      description: 'The number field to change.',
      numeric: true,
    }),
    ...totalcmsOperations.adjustProps(),
  },
  outputSchema: totalcmsOutputSchemas.number,
  async run(context) {
    return totalcmsOperations.adjustNumber({ auth: context.auth, input: context.propsValue });
  },
});
