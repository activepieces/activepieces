import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { describeTableOutputSchema } from '../../common/output-schemas';
import { qualifiedName } from '../../common/sql';

export const describeTableAction = createAction({
  name: 'describe_table_ai',
  classification: 'READ',
  displayName: 'Describe Table',
  description: 'Get the columns of a table by name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the columns of a table or view (DESCRIBE TABLE) with name, data type, nullability, default, key flags and comment. Use before inserting, filtering or updating so column names and types are right. Safe to retry.',
    idempotent: true,
  },
  outputSchema: describeTableOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
  },
  async run(context) {
    const table = qualifiedName({
      value: context.propsValue.table,
      label: 'Table',
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql: `DESCRIBE TABLE ${table}` }),
    });
    return {
      table,
      columns: result.rows.map((col) => ({
        name: col['name'] ?? null,
        type: col['type'] ?? null,
        nullable: col['null?'] === 'Y',
        default: col['default'] ?? null,
        primaryKey: col['primary key'] === 'Y',
        uniqueKey: col['unique key'] === 'Y',
        comment: col['comment'] ?? null,
      })),
    };
  },
});
