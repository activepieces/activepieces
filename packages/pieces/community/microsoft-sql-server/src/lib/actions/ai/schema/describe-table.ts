import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerDescribeTableOutputSchema } from '../../../output-schemas';

export const describeTable = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_describe_table',
  outputSchema: microsoftSqlServerDescribeTableOutputSchema,
  displayName: 'Describe Table',
  description: 'Lists the columns of a table or view with their types, keys, defaults and references.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns every column of a table or view in order: name, full data type (e.g. nvarchar(100)), nullability, identity, computed, default, whether it is in the primary key, and the table and column a foreign key references. Use before reading or writing rows to learn column names, required columns and keys. Schema and table names come from Get Tables. Read-only.',
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
            `SELECT c.name, TYPE_NAME(c.user_type_id) AS type, c.max_length, c.precision, c.scale,
                    c.is_nullable, c.is_identity, c.is_computed, dc.definition AS default_value,
                    CAST(CASE WHEN pk.column_id IS NULL THEN 0 ELSE 1 END AS bit) AS is_primary_key,
                    fk.references_table, fk.references_column
             FROM sys.columns c
             LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
             OUTER APPLY (
               SELECT TOP (1) ic.column_id FROM sys.indexes i
               JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
               WHERE i.object_id = c.object_id AND i.is_primary_key = 1 AND ic.column_id = c.column_id
             ) pk
             OUTER APPLY (
               SELECT TOP (1)
                 OBJECT_SCHEMA_NAME(f.referenced_object_id) + '.' + OBJECT_NAME(f.referenced_object_id) AS references_table,
                 COL_NAME(f.referenced_object_id, f.referenced_column_id) AS references_column
               FROM sys.foreign_key_columns f
               WHERE f.parent_object_id = c.object_id AND f.parent_column_id = c.column_id
             ) fk
             WHERE c.object_id = OBJECT_ID(@name)
             ORDER BY c.column_id`
          );
        const columns = result.recordset.map(({ max_length, precision, scale, ...column }) => ({
          ...column,
          data_type: mssqlAi.typeLabel({
            type: String(column['type']),
            maxLength: Number(max_length),
            precision: Number(precision),
            scale: Number(scale),
          }),
        }));
        return { schema: target.table_schema, table: target.table_name, columns, count: columns.length };
      },
    });
  },
});
