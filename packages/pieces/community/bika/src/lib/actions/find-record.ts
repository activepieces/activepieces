import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const findRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_find_record',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Gets a record from a Bika database by its ID.',
  audience: 'human',
  aiMetadata: {
    description:
      'Gets one Bika.ai record by its record ID from a database picked from dropdowns. Use Find Records to search by field values instead. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    recordId: bikaProps.recordId({ description: 'The record ID, mapped from a Find Records or Create Record step.' }),
  },
  outputSchema: bikaOutputSchemas.humanRecord,
  async run(context) {
    return bikaOperations.humanGet({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.recordId,
    });
  },
});
