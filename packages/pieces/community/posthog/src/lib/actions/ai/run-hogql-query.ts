import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogOutputSchemas } from '../../common/output-schemas';

const MAX_ROWS = 10_000;

function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    for (let n = 2; used.has(candidate); n++) candidate = `${name}_${n}`;
    used.add(candidate);
    return candidate;
  });
}

export const runHogqlQuery = createAction({
  auth: posthogAuth,
  name: 'run_hogql_query',
  classification: 'SEARCH',
  displayName: 'Run HogQL Query',
  description: 'Run a read-only HogQL (SQL) query against your PostHog data.',
  audience: 'ai',
  aiMetadata: {
    description: 'Runs one HogQL SELECT query (PostHog SQL dialect over ClickHouse) on the connected project and returns rows as objects keyed by column name (a repeated column name gets a _2, _3 ... suffix; alias columns to control the keys). Tables: events (uuid, event, distinct_id, timestamp, properties.$current_url, person.properties.email ...), persons, sessions, groups, cohort_people. Always add a WHERE on timestamp and a LIMIT (PostHog caps results at 100 rows without LIMIT, max 10000); hasMore=true means the result was cut at the limit. Example: SELECT event, count() FROM events WHERE timestamp > now() - INTERVAL 7 DAY GROUP BY event ORDER BY count() DESC LIMIT 20. Read-only; INSERT/ALTER are rejected by PostHog.',
    idempotent: true,
  },
  outputSchema: posthogOutputSchemas.query,
  props: {
    query: Property.LongText({ displayName: 'HogQL Query', description: 'A single SELECT statement.', required: true }),
  },
  async run({ auth, propsValue }) {
    const query = posthogClient.requiredText({ value: propsValue.query, label: 'HogQL Query' });
    if (!/^\s*(\(\s*)*(select|with)\b/i.test(query)) {
      throw new Error('Only SELECT (or WITH ... SELECT) queries are supported.');
    }
    const body = posthogClient.recordOf(
      await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.POST,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['query'] }),
        body: { query: { kind: 'HogQLQuery', query }, name: 'activepieces' },
      }),
    );
    if (typeof body['error'] === 'string' && body['error'] !== '') {
      throw new Error(`PostHog query error: ${body['error']}`);
    }
    const columns = uniqueNames(posthogClient.arrayOf(body['columns']).map((c) => String(c)));
    const results = posthogClient.arrayOf(body['results']).slice(0, MAX_ROWS);
    const rows = results.map((row) => {
      const values = posthogClient.arrayOf(row);
      return Object.fromEntries(columns.map((column, i) => [column, values[i] ?? null]));
    });
    return {
      columns,
      types: posthogClient.arrayOf(body['types']).map((t) => (Array.isArray(t) ? String(t[1] ?? t[0]) : String(t))),
      rows,
      rowCount: rows.length,
      hasMore: body['hasMore'] === true,
    };
  },
});
