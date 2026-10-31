import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlDescribeTableOutputSchema } from '../../../output-schemas';

export const describeTable = createAction({
  auth: mysqlAuth,
  name: 'mysql_describe_table',
  outputSchema: mysqlDescribeTableOutputSchema,
  displayName: 'Describe Table',
  description: 'Lists the columns of a table with their types, keys and defaults.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns every column of a table in order: name, data and column type, nullability, default, key (PRI, UNI, MUL) and extra (auto_increment, generated). Use before reading or writing rows to learn column names, required columns and the primary key. Table names come from Get Tables. Read-only.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    database: mysqlAiProps.database,
  },
  async run(context) {
    const { table, database } = context.propsValue;
    const columns: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: async (conn) => {
        const schema = await mysqlAi.resolveDatabase({ conn, database });
        return conn.query(
          'SELECT column_name AS name, data_type AS dataType, column_type AS columnType, is_nullable AS nullable, column_default AS defaultValue, column_key AS columnKey, extra AS extra, column_comment AS comment FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position',
          [schema, table],
        );
      },
    });
    if (columns.length === 0) {
      throw new Error(`Table "${table}" was not found. Use Get Tables to list the tables.`);
    }
    return {
      table,
      columns: columns.map((column) => ({ ...column, nullable: column['nullable'] === 'YES' })),
      count: columns.length,
    };
  },
});
