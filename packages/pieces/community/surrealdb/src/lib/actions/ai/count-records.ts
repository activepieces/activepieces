import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbCountRecordsOutputSchema } from '../../output-schemas';

export const countRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_count_records',
  outputSchema: surrealdbCountRecordsOutputSchema,
  displayName: 'Count Records',
  description: 'Counts the records in a table that match filters.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns how many records of a table match all the filters (or the whole table without filters). Use Find Records to read them. Fails when the table does not exist. Read-only.',
    idempotent: true,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
    filters: surrealdbAiProps.filters({ required: false }),
  },
  async run(context) {
    const { table, filters } = context.propsValue;
    const where = surrealdbUtils.buildWhere({ filters });
    const rows = await surrealdbApi.rpcQuery<{ count: number }[]>({
      auth: context.auth,
      sql: `SELECT count() FROM type::table($table)${where.clause} GROUP ALL;`,
      vars: { ...where.vars, table },
    });
    return { count: rows[0]?.count ?? 0 };
  },
});
