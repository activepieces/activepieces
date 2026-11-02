import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const mergeRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_merge_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Merge Record',
  description: 'Updates some fields of an existing record.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Merges the given fields into an existing record, leaving other fields as they are; nested objects are merged too. Fails when the record does not exist. Use Patch Record to remove fields or edit arrays, Replace Record to overwrite everything.',
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
      sql: 'UPDATE type::record($recordId) MERGE $data;',
      vars: { recordId, data: surrealdbUtils.toObject({ value: data, label: 'Data' }) },
    });
    return surrealdbUtils.singleRecord({ records, recordId });
  },
});
