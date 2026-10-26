import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient } from '../common';

export const runQuery = createAction({
  auth: postgresAuth,
  name: 'run-query',
  classification: 'WRITE',
  displayName: 'Run Query',
  description: 'Runs a SQL statement on the database',
  audience: 'both',
  aiMetadata: {
    description: 'Executes an arbitrary SQL statement against the connected PostgreSQL database and returns the resulting rows. Use this to read, write, or otherwise operate on a Postgres database when no more specific tool fits. Always pass dynamic values via the args array with $1/$2 placeholders (never string-interpolate them) to avoid SQL injection. Not idempotent: the statement can be a mutation (INSERT/UPDATE/DELETE/DDL), so repeating the same call may change data or have side effects each time.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sql',
      display: 'section',
      label: 'SQL statement',
      icon: 'code',
      props: ['markdown', 'query', 'args'],
    },
  ],
  props: {
    markdown: Property.MarkDown({
      value: 'Never type dynamic values into the query. Write $1, $2 and put the values in Arguments to prevent SQL injection.',
      variant: MarkdownVariant.WARNING,
    }),

    query: Property.ShortText({
      displayName: 'Query',
      description: 'The SQL to run. Write $1, $2 where each value goes.',
      placeholder: 'SELECT * FROM orders WHERE id = $1',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for $1, $2 and so on in the query, in order.',
      required: false,
    }),
    query_timeout: Property.Number({
      displayName: 'Query Timeout',
      description: 'Milliseconds to wait for the query before it fails.',
      required: false,
      defaultValue: 30000,
      advanced: true,
    }),
    connection_timeout_ms: Property.Number({
      displayName: 'Connection Timeout',
      description: 'Milliseconds to wait for the connection before it fails.',
      required: false,
      defaultValue: 30000,
      advanced: true,
    }),
    application_name: Property.ShortText({
      displayName: 'Application Name',
      description: "A name that identifies this step in the server's activity list.",
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const client = await pgClient(context.auth, context.propsValue.query_timeout, context.propsValue.application_name, context.propsValue.connection_timeout_ms);
    const { query } = context.propsValue;
    const queryWithMetadata = `
    /* Source : /projects/${context.project.id}/flows/${context.flows.current.id}/runs/${context.run.id} */
    ${query}
    `
    const args = context.propsValue.args || [];
    try {
      const result = await client.query(queryWithMetadata, args);
      return result.rows;
    } finally {
      await client.end();
    }
  },
});
