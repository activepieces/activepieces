import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { cancelQueryOutputSchema } from '../../common/output-schemas';
import { QUERY_ID } from '../../common/query-id';

export const cancelQueryAction = createAction({
  name: 'cancel_query',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Query',
  description: 'Cancel a running query by its query ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Cancels a running or queued query by query ID (SYSTEM$CANCEL_QUERY) and returns Snowflake's message. Work done by the cancelled statement is rolled back. Cancelling a query that already finished only returns a message, so a retry is harmless.",
    idempotent: true,
  },
  outputSchema: cancelQueryOutputSchema,
  auth: snowflakeAuth,
  props: {
    queryId: Property.ShortText({
      displayName: 'Query ID',
      description: 'The query ID (UUID) to cancel.',
      required: true,
    }),
  },
  async run(context) {
    const id = context.propsValue.queryId.trim();
    if (!QUERY_ID.test(id)) {
      throw new Error(
        'Query ID must be a Snowflake query UUID such as 01b2c3d4-0000-1234-0000-0001a2b3c4d5.'
      );
    }
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: 'SELECT SYSTEM$CANCEL_QUERY(?) AS "message"',
          binds: [id],
          maxRows: 1,
        }),
    });
    const row = result.rows[0] ?? {};
    return {
      queryId: id,
      message: String(row['message'] ?? Object.values(row)[0] ?? ''),
    };
  },
});
