import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { tableSchemaOutputSchema } from '../common/output-schemas';
import { qualifiedName } from '../common/sql';

export const getTableSchemaAction = createAction({
  name: 'get_table_schema',
  classification: 'READ',
  displayName: 'Get Table Schema',
  description:
    'Retrieve the column definitions (name, data type, nullability, default) for a Snowflake table.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the column definitions (name, type, nullability, default, key flags, comment) of a table chosen from dropdowns. For a free-text table name use Describe Table. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: tableSchemaOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
  },
  async run(context) {
    const { table } = context.propsValue;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: `DESCRIBE TABLE ${qualifiedName({
            value: table,
            label: 'Table',
          })}`,
        }),
    });
    const columns = result.rows.map((col) => ({
      column_name: col['name'] ?? null,
      data_type: col['type'] ?? null,
      nullable: col['null?'] ?? null,
      default_value: col['default'] ?? null,
      primary_key: col['primary key'] ?? null,
      unique_key: col['unique key'] ?? null,
      check: col['check'] ?? null,
      expression: col['expression'] ?? null,
      comment: col['comment'] ?? null,
    }));
    return { table, columns };
  },
});
