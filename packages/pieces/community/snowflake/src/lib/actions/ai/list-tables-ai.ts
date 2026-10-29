import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { mapTable } from '../../common/mappers';
import { aiProps } from '../../common/ai-props';
import { likeClause, listShow, scopeClause } from '../../common/operations';
import { listTablesAiOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listTablesAiAction = createAction({
  name: 'list_tables_ai',
  classification: 'SEARCH',
  displayName: 'List Tables (by Name)',
  description: 'List tables in a schema or database by name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists tables (SHOW TABLES) in a schema, a whole database, or the connection default schema, with kind, row and byte counts and owner; filter with a LIKE name pattern. Use to find a table name for the row actions. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listTablesAiOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: aiProps.database(false),
    schema: aiProps.schema(false),
    namePattern: aiProps.namePattern,
    limit: aiProps.limit(100, 1000),
  },
  async run(context) {
    const p = context.propsValue;
    const limit = boundedInteger({
      value: p.limit,
      defaultValue: 100,
      min: 1,
      max: 1000,
      label: 'Limit',
    });
    const sql = `SHOW TABLES${likeClause(p.namePattern)}${scopeClause({
      database: p.database,
      schema: p.schema,
    })}`;
    return withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        listShow({
          session,
          sql,
          limit,
          map: mapTable,
        }),
    });
  },
});
