import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaProps } from '../common/props';
import { bikaOutputSchemas } from '../output-schemas';

export const deleteRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes a record in database by ID.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes one Bika.ai record by its record ID from a database picked from dropdowns. A retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    space_id: bikaProps.space(),
    database_id: bikaProps.database(),
    recordId: bikaProps.recordId({ description: 'The ID of the record to delete (starts with "rec").' }),
  },
  outputSchema: bikaOutputSchemas.humanDeleted,
  async run(context) {
    return bikaOperations.humanDelete({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.recordId,
    });
  },
});
