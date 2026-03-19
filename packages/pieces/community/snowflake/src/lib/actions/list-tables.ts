import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

export const listTablesAction = createAction({
  name: 'list_tables',
  displayName: 'List Tables',
  description: 'List all tables in a Snowflake schema.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
  },
  async run(context) {
    const { database, schema } = context.propsValue;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(
        connection,
        `SHOW TABLES IN SCHEMA ${database}.${schema}`,
        []
      );
      if (!result) return [];

      return (result as Record<string, unknown>[]).map((t) => ({
        table_name: t['name'] ?? null,
        database_name: t['database_name'] ?? null,
        schema_name: t['schema_name'] ?? null,
        kind: t['kind'] ?? null,
        rows: t['rows'] ?? null,
        bytes: t['bytes'] ?? null,
        owner: t['owner'] ?? null,
        comment: t['comment'] ?? null,
        created_on: t['created_on'] ?? null,
      }));
    } finally {
      await destroy(connection);
    }
  },
});
