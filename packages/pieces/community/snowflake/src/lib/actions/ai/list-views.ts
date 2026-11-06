import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { mapView } from '../../common/mappers';
import { aiProps } from '../../common/ai-props';
import { likeClause, listShow, scopeClause } from '../../common/operations';
import { listViewsOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listViewsAction = createAction({
  name: 'list_views',
  classification: 'SEARCH',
  displayName: 'List Views',
  description: 'List views in a schema or database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists views (SHOW VIEWS) in a schema, a whole database, or the connection default schema, with owner, secure and materialized flags and definition text; filter with a LIKE name pattern. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listViewsOutputSchema,
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
    const sql = `SHOW VIEWS${likeClause(p.namePattern)}${scopeClause({
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
          map: mapView,
        }),
    });
  },
});
