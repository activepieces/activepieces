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
import { listRolesOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listRolesAction = createAction({
  name: 'list_roles',
  classification: 'SEARCH',
  displayName: 'List Roles',
  description: 'List the roles visible to the current role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists roles (SHOW ROLES) with whether each is current or default and how many grants it has; filter with a LIKE name pattern. Read-only: it does not grant or revoke. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listRolesOutputSchema,
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
    const sql = `SHOW ROLES${likeClause(p.namePattern)}`;
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
                'is_current',
                'is_default',
                'granted_to_roles',
                'granted_roles',
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
