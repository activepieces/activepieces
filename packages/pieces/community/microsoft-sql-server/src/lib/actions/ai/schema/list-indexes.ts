import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerListIndexesOutputSchema } from '../../../output-schemas';

export const listIndexes = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_list_indexes',
  outputSchema: microsoftSqlServerListIndexesOutputSchema,
  displayName: 'List Indexes',
  description: 'Lists the indexes of a table with their key and included columns.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the indexes of a table or indexed view: name, type (CLUSTERED, NONCLUSTERED, ...), whether it is the primary key, unique or a unique constraint, disabled, its filter, its key columns in order with direction, and its included columns. Use to find the unique keys Upsert Row can match on, or to see which filters are indexed. Read-only.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
  },
  async run(context) {
    const { schema, table } = context.propsValue;
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: mssqlAi.TABLE_KINDS, label: 'Table' });
        const result = await pool
          .request()
          .input('name', mssqlCommon.quoteTable(target))
          .query<Record<string, unknown>>(
            `SELECT i.index_id, i.name, i.type_desc AS type, i.is_primary_key, i.is_unique,
                    i.is_unique_constraint, i.is_disabled, i.filter_definition AS filter,
                    c.name AS column_name, ic.is_descending_key, ic.is_included_column
             FROM sys.indexes i
             LEFT JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
             LEFT JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
             WHERE i.object_id = OBJECT_ID(@name) AND i.index_id > 0
             ORDER BY i.index_id, ic.is_included_column, ic.key_ordinal, ic.index_column_id`
          );
        const indexes = groupIndexes({ rows: result.recordset });
        return { schema: target.table_schema, table: target.table_name, indexes, count: indexes.length };
      },
    });
  },
});

function groupIndexes({ rows }: { rows: Record<string, unknown>[] }): IndexEntry[] {
  const ids = [...new Set(rows.map((row) => Number(row['index_id'])))];
  return ids.map((id) => {
    const members = rows.filter((row) => Number(row['index_id']) === id);
    const first = members[0];
    const named = members.filter((row) => row['column_name'] !== null);
    return {
      name: String(first['name']),
      type: String(first['type']),
      is_primary_key: Boolean(first['is_primary_key']),
      is_unique: Boolean(first['is_unique']),
      is_unique_constraint: Boolean(first['is_unique_constraint']),
      is_disabled: Boolean(first['is_disabled']),
      filter: first['filter'] ?? null,
      key_columns: named
        .filter((row) => !row['is_included_column'])
        .map((row) => ({ name: String(row['column_name']), descending: Boolean(row['is_descending_key']) })),
      included_columns: named.filter((row) => row['is_included_column']).map((row) => String(row['column_name'])),
    };
  });
}

type IndexEntry = {
  name: string;
  type: string;
  is_primary_key: boolean;
  is_unique: boolean;
  is_unique_constraint: boolean;
  is_disabled: boolean;
  filter: unknown;
  key_columns: { name: string; descending: boolean }[];
  included_columns: string[];
};
