import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import {
  aiProps,
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
} from '../../common/ai-props';
import { callProcedureOutputSchema } from '../../common/output-schemas';
import { buildCall } from '../../common/procedures';
import { boundedInteger } from '../../common/sql';

export const callProcedureAction = createAction({
  name: 'call_procedure',
  classification: 'WRITE',
  displayName: 'Call Procedure',
  description: 'Call a stored procedure with positional arguments.',
  audience: 'ai',
  aiMetadata: {
    description:
      'CALLs a stored procedure by name with positional arguments (objects and arrays are passed as JSON) and returns its return value plus any result rows. Check the signature with List Procedures first. A procedure can change data on every call, so treat retries as repeating its effect.',
    idempotent: false,
  },
  outputSchema: callProcedureOutputSchema,
  auth: snowflakeAuth,
  props: {
    procedure: Property.ShortText({
      displayName: 'Procedure',
      description:
        'Procedure name, optionally qualified as DATABASE.SCHEMA.PROCEDURE (no parentheses).',
      required: true,
    }),
    arguments: Property.Array({
      displayName: 'Arguments',
      description:
        'Positional argument values, in the order of the procedure signature.',
      required: false,
    }),
    limit: aiProps.limit(READ_DEFAULT_LIMIT, READ_MAX_LIMIT),
  },
  async run(context) {
    const { procedure, arguments: args, limit } = context.propsValue;
    const max = boundedInteger({
      value: limit,
      defaultValue: READ_DEFAULT_LIMIT,
      min: 1,
      max: READ_MAX_LIMIT,
      label: 'Limit',
    });
    const { sql, binds } = buildCall({ procedure, args: args ?? [] });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds, maxRows: max }),
    });
    const first = result.rows[0];
    return {
      result: first ? Object.values(first)[0] ?? null : null,
      rows: result.rows,
      rowCount: result.rows.length,
      truncated: result.truncated,
      queryId: result.queryId,
    };
  },
});
