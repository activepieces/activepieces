import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const upsertRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_upsert_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Upsert Record',
  description: 'Creates a record or merges fields into it if it exists.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates the record with the given "table:id" id when it does not exist, otherwise merges the given fields into it, and returns the record. Repeating it with the same data gives the same result. Use Create Record when the id should be generated.',
    idempotent: true,
  },
  props: {
    recordId: surrealdbAiProps.recordId({ required: true }),
    data: surrealdbAiProps.data({ required: true }),
  },
  async run(context) {
    const { recordId, data } = context.propsValue;
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: 'UPSERT type::record($recordId) MERGE $data;',
      vars: { recordId, data: surrealdbUtils.toObject({ value: data, label: 'Data' }) },
    });
    return surrealdbUtils.singleRecord({ records, recordId });
  },
});
