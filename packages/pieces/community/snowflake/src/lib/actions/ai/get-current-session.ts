import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { sessionOutputSchema } from '../../common/output-schemas';

export const getCurrentSessionAction = createAction({
  name: 'get_current_session',
  classification: 'READ',
  displayName: 'Get Current Session',
  description:
    'Show the user, role, warehouse, database and schema this connection uses.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the current user, role, warehouse, database, schema, account, region and Snowflake version of the connection. Use first to learn the defaults that unqualified table names resolve against, or to verify the connection works. Safe to retry.',
    idempotent: true,
  },
  outputSchema: sessionOutputSchema,
  auth: snowflakeAuth,
  props: {},
  async run(context) {
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: 'SELECT CURRENT_USER() AS "user", CURRENT_ROLE() AS "role", CURRENT_WAREHOUSE() AS "warehouse", CURRENT_DATABASE() AS "database", CURRENT_SCHEMA() AS "schema", CURRENT_ACCOUNT() AS "account", CURRENT_REGION() AS "region", CURRENT_VERSION() AS "version"',
          maxRows: 1,
        }),
    });
    const row = result.rows[0] ?? {};
    return {
      user: row['user'] ?? null,
      role: row['role'] ?? null,
      warehouse: row['warehouse'] ?? null,
      database: row['database'] ?? null,
      schema: row['schema'] ?? null,
      account: row['account'] ?? null,
      region: row['region'] ?? null,
      version: row['version'] ?? null,
    };
  },
});
