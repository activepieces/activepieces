import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordOutputSchema } from '../../output-schemas';

export const createRecordAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_create_record',
  outputSchema: surrealdbRecordOutputSchema,
  displayName: 'Create Record',
  description: 'Creates a record in a table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates one record in a table, with a generated id or the given one, and returns it with its full "table:id" id. Fails if a record with that id already exists; use Upsert Record to create-or-update. Creates the table if it does not exist (unless the database is strict). Repeating it without an id creates duplicates.',
    idempotent: false,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
    id: Property.ShortText({
      displayName: 'ID',
      description: 'The id part only, without the table, e.g. "tobie" for "person:tobie". Leave empty to generate one.',
      required: false,
    }),
    data: surrealdbAiProps.data({ required: true }),
  },
  async run(context) {
    const { table, id, data } = context.propsValue;
    const content = surrealdbUtils.toObject({ value: data, label: 'Data' });
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: id ? 'CREATE type::record($table, $id) CONTENT $data;' : 'CREATE type::table($table) CONTENT $data;',
      vars: { table, id, data: content },
    });
    return surrealdbUtils.singleRecord({ records, recordId: id ? `${table}:${id}` : table });
  },
});
