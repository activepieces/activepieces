import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../../auth';
import { bikaOperations } from '../../common/operations';
import { bikaProps } from '../../common/props';
import { bikaOutputSchemas } from '../../output-schemas';

export const getRecordByIdAction = createAction({
  auth: BikaAuth,
  name: 'get_record_by_id',
  classification: 'READ',
  displayName: 'Get Record (by ID)',
  description: 'Gets one record by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one Bika.ai record, given its space, database and record IDs, with its cell values keyed by field name. Use Find Records (by ID) when you do not know the record ID. Read-only.',
    idempotent: true,
  },
  props: {
    space_id: bikaProps.spaceIdText(),
    database_id: bikaProps.databaseIdText(),
    record_id: bikaProps.recordIdText({ description: 'The record ID (starts with "rec").' }),
  },
  outputSchema: bikaOutputSchemas.agentRecord,
  async run(context) {
    return bikaOperations.agentGet({
      auth: context.auth,
      spaceId: context.propsValue.space_id,
      databaseId: context.propsValue.database_id,
      recordId: context.propsValue.record_id,
    });
  },
});
