import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const deleteRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_delete_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Delete Record',
  description: 'Permanently deletes one record by its id.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes one record by its full "table:id" id and returns the record as it was before deletion. Fails when the record does not exist. There is no trash; use Delete Records to delete by filter.',
    idempotent: false,
  },
  props: {
    recordId: surrealdbAiProps.recordId({ required: true }),
  },
  async run(context) {
    const { recordId } = context.propsValue;
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: 'DELETE type::record($recordId) RETURN BEFORE;',
      vars: { recordId },
    });
    return surrealdbUtils.singleRecord({ records, recordId });
  },
});
