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
import { listStagesOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listStagesAction = createAction({
  name: 'list_stages',
  classification: 'SEARCH',
  displayName: 'List Stages',
  description: 'List stages in a schema or database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists named stages (SHOW STAGES) in a schema, a whole database, or the connection default schema, with type (internal/external) and URL; filter with a LIKE name pattern. Use before List Stage Files. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listStagesOutputSchema,
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
    const sql = `SHOW STAGES${likeClause(p.namePattern)}${scopeClause({
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
          map: (row) => ({
            ...pick({
              row,
              keys: [
                'name',
                'database_name',
                'schema_name',
                'type',
                'url',
                'owner',
                'comment',
              ],
            }),
            created_on: normaliseTimestamp(row['created_on']),
          }),
        }),
    });
  },
});
