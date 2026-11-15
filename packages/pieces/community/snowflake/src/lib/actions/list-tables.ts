import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { mapTable } from '../common/mappers';
import { listTablesOutputSchema } from '../common/output-schemas';
import { qualifiedName } from '../common/sql';

export const listTablesAction = createAction({
  name: 'list_tables',
  classification: 'SEARCH',
  displayName: 'List Tables',
  description: 'List all tables in a Snowflake schema.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every table in a database and schema chosen from dropdowns, with kind, row and byte counts, owner and creation time. For free-text names or a name pattern use List Tables (by name). Read-only.',
    idempotent: true,
  },
  outputSchema: listTablesOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
  },
  async run(context) {
    const { database, schema } = context.propsValue;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: `SHOW TABLES IN SCHEMA ${qualifiedName({
            value: `${database}.${schema}`,
            maxParts: 2,
            label: 'Schema',
          })}`,
        }),
    });
    return result.rows.map(mapTable);
  },
});
