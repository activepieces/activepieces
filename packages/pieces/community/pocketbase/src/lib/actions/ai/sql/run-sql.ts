import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseRunSqlOutputSchema } from '../../../output-schemas';

export const runSqlAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_run_sql',
  outputSchema: pocketbaseRunSqlOutputSchema,
  displayName: 'Run SQL',
  description: 'Runs a SQL query against the instance database.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Runs raw SQLite SQL against the database and returns columns and rows; with several statements only the last result is returned. Writes bypass API rules and record hooks, so prefer the record actions for normal data changes. Needs PocketBase v0.39 or later.',
    idempotent: false,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'SQLite SQL, e.g. "SELECT status, COUNT(*) AS total FROM orders GROUP BY status".',
      required: true,
    }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/sql',
      body: { query: context.propsValue.query },
    });
  },
});
