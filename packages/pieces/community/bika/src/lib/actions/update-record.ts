import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const updateRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates an existing record in database.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the fields of one existing Bika.ai record, given its record ID, in a database picked from dropdowns. Only the fields you fill in are changed; empty inputs keep their current value. Repeating the call with the same values leaves the record in the same state.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    recordId: bikaProps.recordId({ description: 'The ID of the record to update (starts with "rec").' }),
    fields: bikaProps.fields({ description: 'The new values. Empty inputs keep their current value.' }),
  },
  outputSchema: bikaOutputSchemas.humanRecord,
  async run(context) {
    return bikaOperations.humanUpdate({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.recordId,
      fields: context.propsValue.fields,
    });
  },
});
