import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const deleteRecordByIdAction = createAction({
  auth: BikaAuth,
  name: 'delete_record_by_id',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record (by ID)',
  description: 'Permanently deletes a record by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Bika.ai record, given its space, database and record IDs. There is no undo; confirm the record with Get Record (by ID) first if unsure. A retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
    database_id: bikaProps.databaseIdText(),
    record_id: bikaProps.recordIdText({ description: 'The ID of the record to delete (starts with "rec").' }),
  },
  outputSchema: bikaOutputSchemas.agentDeleted,
  async run(context) {
    return bikaOperations.agentDelete({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.record_id,
    });
  },
});
