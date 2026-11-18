import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordsOutputSchema } from '../../output-schemas';

export const deleteRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_delete_records',
  outputSchema: surrealdbRecordsOutputSchema,
  displayName: 'Delete Records',
  description: 'Permanently deletes every record that matches filters.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes every record of a table that matches all the filters, in one transaction, and returns the deleted records. Fails without deleting anything when more records match than Max Rows (default 100). Filters are required; use Delete Record for one id. There is no trash.',
    idempotent: false,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
    filters: surrealdbAiProps.filters({ required: true }),
    maxRows: surrealdbAiProps.maxRows({ required: false }),
  },
  async run(context) {
    const { table, filters, maxRows } = context.propsValue;
    const where = surrealdbUtils.buildWhere({ filters });
    if (where.clause === '') {
      throw new Error('Filters must have at least one condition. Use Find Records to check which records match.');
    }
    const maxRowsValue = surrealdbUtils.boundedInteger({ value: maxRows, defaultValue: surrealdbAiProps.DEFAULT_MAX_ROWS, min: 1, max: Number.MAX_SAFE_INTEGER, label: 'Max Rows' });
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: `BEGIN; LET $matched = (SELECT count() FROM type::table($table)${where.clause} GROUP ALL)[0].count ?? 0; IF $matched > $max_rows { THROW "The filters match " + <string>$matched + " records, more than Max Rows (" + <string>$max_rows + "). Nothing was deleted; narrow the filters or raise Max Rows."; }; LET $changed = (DELETE type::table($table)${where.clause} RETURN BEFORE); COMMIT; RETURN $changed;`,
      vars: { ...where.vars, table, max_rows: maxRowsValue },
    });
    return { records, count: records.length };
  },
});
