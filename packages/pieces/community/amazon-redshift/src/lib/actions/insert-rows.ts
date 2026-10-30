import { createAction } from '@activepieces/pieces-framework';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import { insertRowsOutputSchema } from '../output-schemas';

const MAX_ROWS = 500;

export const insertRows = createAction({
  auth: redshiftAuth,
  name: 'insert_rows',
  classification: 'WRITE',
  displayName: 'Insert Rows',
  description: 'Inserts one or more rows into a table.',
  audience: 'both',
  outputSchema: insertRowsOutputSchema,
  aiMetadata: {
    description: `Inserts up to ${MAX_ROWS} rows into an Amazon Redshift table in one INSERT statement, each row a map of column names to values; if any row fails, none are inserted. Columns a row leaves empty get the column default. Returns only the inserted row count, because Redshift cannot return the stored rows. Not idempotent: each call appends new rows.`,
    idempotent: false,
  },
  props: {
    table: redshiftProps.table({ required: true }),
    batch: redshiftProps.rows({ required: true }),
  },
  async run(context) {
    const { table, batch } = context.propsValue;
    const submitted: unknown[] = Array.isArray(batch['rows']) ? batch['rows'] : [];
    const records = submitted.map((row) => redshiftUtils.filledFields({ values: row }));
    if (records.length === 0) {
      throw new Error('Add at least one row.');
    }
    if (records.length > MAX_ROWS) {
      throw new Error(`At most ${MAX_ROWS} rows can be inserted per step. Split the rows over several steps.`);
    }
    const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];
    if (columns.length === 0) {
      throw new Error('Fill at least one column.');
    }
    const { tuples, params } = buildValues({ records, columns });
    const sql = `INSERT INTO ${redshiftUtils.qualifiedName({ table })} (${columns.map((name) => redshiftUtils.quoteIdentifier({ name })).join(', ')}) VALUES ${tuples.join(', ')}`;
    const { rowCount } = await redshiftClient.runSql({ auth: context.auth, server: context.server, sql, params });
    return { rowCount };
  },
});

function buildValues({ records, columns }: { records: Record<string, unknown>[]; columns: string[] }): { tuples: string[]; params: unknown[] } {
  const params: unknown[] = [];
  const tuples = records.map((record) => {
    const cells = columns.map((name) => {
      if (!(name in record)) {
        return 'DEFAULT';
      }
      params.push(record[name]);
      return `$${params.length}`;
    });
    return `(${cells.join(', ')})`;
  });
  return { tuples, params };
}
