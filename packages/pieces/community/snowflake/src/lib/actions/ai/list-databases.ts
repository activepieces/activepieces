import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import {
  likeClause,
  listShow,
  normaliseTimestamp,
  pick,
} from '../../common/operations';
import { listDatabasesOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listDatabasesAction = createAction({
  name: 'list_databases',
  classification: 'SEARCH',
  displayName: 'List Databases',
  description: 'List the databases visible to the current role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists databases the current role can see (SHOW DATABASES), with owner, kind and comment; filter with a LIKE name pattern. Use to find a database name for other actions. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listDatabasesOutputSchema,
  auth: snowflakeAuth,
  props: {
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
    const sql = `SHOW DATABASES${likeClause(p.namePattern)}`;
    return withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        listShow({
          session,
          sql,
          limit,
          map: (row) => ({
            ...pick({ row, keys: ['name', 'owner', 'kind', 'comment'] }),
            created_on: normaliseTimestamp(row['created_on']),
          }),
        }),
    });
  },
});
