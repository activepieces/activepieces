import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi } from '../../../ai-common';
import { postgresListActivityOutputSchema } from '../../../output-schemas';

export const listActivity = createAction({
  auth: postgresAuth,
  name: 'postgres_list_activity',
  outputSchema: postgresListActivityOutputSchema,
  displayName: 'List Activity',
  description: 'Lists the sessions connected to the current database and what they are running.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the sessions connected to the current database: process id, user, application, client address, state, the current or last query, when it started, and what it is waiting on. Use to spot long-running or blocked queries. Query text of other users\' sessions is hidden unless the connection user has the pg_read_all_stats role. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        client.query(
          `SELECT pid, usename AS "user", application_name AS application, host(client_addr) AS "clientAddress", state, query, backend_start AS "backendStart", xact_start AS "transactionStart", query_start AS "queryStart", state_change AS "stateChange", wait_event_type AS "waitEventType", wait_event AS "waitEvent", pid = pg_backend_pid() AS "isCurrentSession" FROM pg_stat_activity WHERE datname = current_database() ORDER BY backend_start`,
        ),
    });
    return { sessions: result.rows, count: result.rows.length };
  },
});
