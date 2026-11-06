import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const replaceRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_replace_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Replace Record',
  description: 'Replaces all fields of an existing record.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Replaces the whole content of an existing record with the given data; fields not in the data are removed (the id is kept). Fails when the record does not exist. Use Merge Record to change only some fields, or Upsert Record to create it when missing.',
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
      sql: 'UPDATE type::record($recordId) CONTENT $data;',
      vars: { recordId, data: surrealdbUtils.toObject({ value: data, label: 'Data' }) },
    });
    return surrealdbUtils.singleRecord({ records, recordId });
  },
});
