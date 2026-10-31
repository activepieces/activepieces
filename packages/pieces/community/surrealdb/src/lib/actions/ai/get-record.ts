import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const getRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_get_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Get Record',
  description: 'Gets one record by its id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one record by its full "table:id" id. Fails when the record does not exist. Use Find Records to search by field values. Read-only.',
    idempotent: true,
  },
  props: {
    recordId: surrealdbAiProps.recordId({ required: true }),
  },
  async run(context) {
    const { recordId } = context.propsValue;
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: 'SELECT * FROM type::record($recordId);',
      vars: { recordId },
    });
    return surrealdbUtils.singleRecord({ records, recordId });
  },
});
