import { createAction } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import {
  isUserDefined,
  likeClause,
  listShow,
  normaliseTimestamp,
  pick,
  scopeClause,
} from '../../common/operations';
import { listProceduresOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listProceduresAction = createAction({
  name: 'list_procedures',
  classification: 'SEARCH',
  displayName: 'List Procedures',
  description: 'List stored procedures in a schema or database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists stored procedures (SHOW PROCEDURES) in a schema, a whole database, or the connection default schema, with their signature (argument types) and description; filter with a LIKE name pattern. Use before Call Procedure. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listProceduresOutputSchema,
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
    const sql = `SHOW PROCEDURES${likeClause(p.namePattern)}${scopeClause({
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
          include: isUserDefined,
          map: (row) => ({
            ...pick({
              row,
              keys: ['name', 'schema_name', 'arguments', 'description'],
            }),
            database_name: row['catalog_name'] ?? null,
            created_on: normaliseTimestamp(row['created_on']),
          }),
        }),
    });
  },
});
