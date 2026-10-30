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
import { listWarehousesOutputSchema } from '../../common/output-schemas';
import { boundedInteger } from '../../common/sql';

export const listWarehousesAction = createAction({
  name: 'list_warehouses',
  classification: 'SEARCH',
  displayName: 'List Warehouses',
  description: 'List the virtual warehouses visible to the current role.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists virtual warehouses (SHOW WAREHOUSES) with state, size, auto-suspend and whether each is the current one; filter with a LIKE name pattern. Read-only: it does not start, stop or resize warehouses. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listWarehousesOutputSchema,
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
    const sql = `SHOW WAREHOUSES${likeClause(p.namePattern)}`;
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
                'state',
                'type',
                'size',
                'auto_suspend',
                'auto_resume',
                'is_current',
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
