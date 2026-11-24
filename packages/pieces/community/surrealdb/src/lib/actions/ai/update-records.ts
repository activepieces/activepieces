import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRecordsOutputSchema } from '../../output-schemas';

export const updateRecordsAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_update_records',
  outputSchema: surrealdbRecordsOutputSchema,
  displayName: 'Update Records',
  description: 'Merges fields into every record that matches filters.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Merges the given fields into every record of a table that matches all the filters, in one transaction, and returns the updated records. Fails without changing anything when more records match than Max Rows (default 100). Filters are required; use Merge Record for one id.',
    idempotent: true,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
    filters: surrealdbAiProps.filters({ required: true }),
    data: surrealdbAiProps.data({ required: true }),
    maxRows: surrealdbAiProps.maxRows({ required: false }),
  },
  async run(context) {
    const { table, filters, data, maxRows } = context.propsValue;
    const where = surrealdbUtils.buildWhere({ filters });
    if (where.clause === '') {
      throw new Error('Filters must have at least one condition. Use Find Records to check which records match.');
    }
    const maxRowsValue = surrealdbUtils.boundedInteger({ value: maxRows, defaultValue: surrealdbAiProps.DEFAULT_MAX_ROWS, min: 1, max: Number.MAX_SAFE_INTEGER, label: 'Max Rows' });
    const records = await surrealdbApi.rpcQuery<Record<string, unknown>[]>({
      auth: context.auth,
      sql: `BEGIN; LET $matched = (SELECT count() FROM type::table($table)${where.clause} GROUP ALL)[0].count ?? 0; IF $matched > $max_rows { THROW "The filters match " + <string>$matched + " records, more than Max Rows (" + <string>$max_rows + "). Nothing was updated; narrow the filters or raise Max Rows."; }; LET $changed = (UPDATE type::table($table) MERGE $data${where.clause} RETURN AFTER); COMMIT; RETURN $changed;`,
      vars: { ...where.vars, table, data: surrealdbUtils.toObject({ value: data, label: 'Data' }), max_rows: maxRowsValue },
    });
    return { records, count: records.length };
  },
});
