import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import {
  likeClause,
  listShow,
  normaliseTimestamp,
  pick,
  scopeClause,
} from '../../common/operations';
import { listSchemasOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listSchemasAction = createAction({
  name: 'list_schemas',
  classification: 'SEARCH',
  displayName: 'List Schemas',
  description: 'List the schemas in a database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists schemas in a database (SHOW SCHEMAS), with owner and comment; filter with a LIKE name pattern. Use to find a schema before listing tables. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listSchemasOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: aiProps.database(false),
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
    const sql = `SHOW SCHEMAS${likeClause(p.namePattern)}${scopeClause({
      database: p.database,
    })}`;
    return withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        listShow({
          session,
          sql,
          limit,
          map: (row) => ({
            ...pick({
              row,
              keys: ['name', 'database_name', 'owner', 'comment'],
            }),
            created_on: normaliseTimestamp(row['created_on']),
          }),
        }),
    });
  },
});
