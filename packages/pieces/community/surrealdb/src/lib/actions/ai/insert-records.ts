import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordsOutputSchema } from '../../output-schemas';

export const insertRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_insert_records',
  outputSchema: surrealdbRecordsOutputSchema,
  displayName: 'Insert Records',
  description: 'Inserts several records into a table in one statement.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Inserts an array of records into a table in one statement and returns them with their ids. A record may set "id" to the id part only (e.g. "tobie"); others get generated ids. The whole insert fails if any id already exists. Repeating it without ids creates duplicates.',
    idempotent: false,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
    records: Property.Json({
      displayName: 'Records',
      description: 'JSON array of record objects, e.g. [{"name": "Ada"}, {"id": "alan", "name": "Alan"}]. An "id" is the id part only, without the table.',
      required: true,
    }),
  },
  async run(context) {
    const { table, records } = context.propsValue;
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Records must be a non-empty JSON array of objects.');
    }
    const inserted = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: 'INSERT INTO $table $records;',
      vars: { table, records: records.map((record, index) => surrealdbUtils.toObject({ value: record, label: `Record ${index + 1}` })) },
    });
    return { records: inserted, count: inserted.length };
  },
});
