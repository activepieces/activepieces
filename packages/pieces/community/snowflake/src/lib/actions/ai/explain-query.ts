import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { explainOutputSchema } from '../../common/output-schemas';
import {
  assertReadOnlyStatement,
  firstKeyword,
  toBind,
} from '../../common/sql';

export const explainQueryAction = createAction({
  name: 'explain_query',
  classification: 'READ',
  displayName: 'Explain Query',
  description:
    'Show the execution plan of a read-only query without running it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Snowflake execution plan (EXPLAIN USING JSON) of one SELECT or WITH query without running it, to check cost (partitions, bytes) or validity before Run Select Query. Uses no warehouse credits for the query itself. Safe to retry.',
    idempotent: true,
  },
  outputSchema: explainOutputSchema,
  auth: snowflakeAuth,
  props: {
    sql: Property.LongText({
      displayName: 'SQL',
      description: 'One SELECT or WITH query. Use ? placeholders for values.',
      required: true,
    }),
    parameters: Property.Array({
      displayName: 'Parameters',
      description: 'Values for the ? placeholders, in order.',
      required: false,
    }),
  },
  async run(context) {
    const statement = assertReadOnlyStatement(context.propsValue.sql);
    const first = firstKeyword(statement);
    if (first !== 'SELECT' && first !== 'WITH') {
      throw new Error('Explain Query only accepts SELECT or WITH queries.');
    }
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: `EXPLAIN USING JSON ${statement}`,
          binds: (context.propsValue.parameters ?? []).map(toBind),
          maxRows: 1,
        }),
    });
    const row = result.rows[0] ?? {};
    const raw = row['content'] ?? Object.values(row)[0] ?? null;
    let plan: unknown = raw;
    if (typeof raw === 'string') {
      try {
        plan = JSON.parse(raw);
      } catch {
        plan = raw;
      }
    }
    return { plan };
  },
});
