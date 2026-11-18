import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi } from '../../../ai-common';
import { postgresGetServerInfoOutputSchema } from '../../../output-schemas';

export const getServerInfo = createAction({
  auth: postgresAuth,
  name: 'postgres_get_server_info',
  outputSchema: postgresGetServerInfoOutputSchema,
  displayName: 'Get Server Info',
  description: 'Returns the server version and the settings of the current session.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the Postgres version, the connected database and user, the session time zone, search path and encoding, and whether the server is a read-only replica. Use to learn which SQL features are available and how unqualified table names resolve. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        client.query(
          `SELECT version() AS version, current_setting('server_version') AS "serverVersion", current_setting('server_version_num')::int AS "serverVersionNum", current_database() AS database, current_user AS "user", current_setting('TimeZone') AS "timeZone", current_setting('search_path') AS "searchPath", current_setting('server_encoding') AS encoding, pg_is_in_recovery() AS "isReplica"`,
        ),
    });
    return result.rows[0];
  },
});
