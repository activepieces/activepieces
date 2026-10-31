import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlListIndexesOutputSchema } from '../../../output-schemas';

export const listIndexes = createAction({
  auth: mysqlAuth,
  name: 'mysql_list_indexes',
  outputSchema: mysqlListIndexesOutputSchema,
  displayName: 'List Indexes',
  description: 'Lists the indexes of a table and the columns each one covers.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the indexes of a table (PRIMARY first), each with whether it is unique, its type and its columns in order. Use to find the primary or unique key that Get Row by Key and Upsert Row rely on, or which filters are indexed. Table names come from Get Tables. Read-only.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    database: mysqlAiProps.database,
  },
  async run(context) {
    const { table, database } = context.propsValue;
    const rows: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: async (conn) => {
        const { schema: tableSchema, name } = mysqlAi.splitTable({ table });
        const schema = tableSchema ?? (await mysqlAi.resolveDatabase({ conn, database }));
        return conn.query(
          "SELECT index_name AS name, non_unique AS nonUnique, index_type AS type, column_name AS columnName FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? ORDER BY index_name <> 'PRIMARY', index_name, seq_in_index",
          [schema, name],
        );
      },
    });
    const indexes = groupIndexes({ rows });
    return { table, indexes, count: indexes.length };
  },
});

function groupIndexes({ rows }: { rows: Record<string, unknown>[] }): IndexInfo[] {
  return rows.reduce<IndexInfo[]>((indexes, row) => {
    const name = String(row['name']);
    const last = indexes[indexes.length - 1];
    const column = String(row['columnName']);
    if (last !== undefined && last.name === name) {
      return [...indexes.slice(0, -1), { ...last, columns: [...last.columns, column] }];
    }
    return [...indexes, { name, unique: Number(row['nonUnique']) === 0, type: String(row['type']), columns: [column] }];
  }, []);
}

type IndexInfo = {
  name: string;
  unique: boolean;
  type: string;
  columns: string[];
};
