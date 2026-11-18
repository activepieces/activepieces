import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi } from '../../../common/ai';
import { mysqlGetServerInfoOutputSchema } from '../../../output-schemas';

export const getServerInfo = createAction({
  auth: mysqlAuth,
  name: 'mysql_get_server_info',
  outputSchema: mysqlGetServerInfoOutputSchema,
  displayName: 'Get Server Info',
  description: 'Returns the server version, current database and user, time zone and SQL mode.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the MySQL server version, the connection database and user, the server and session time zones, the SQL mode and whether the server is read-only. Use to check which SQL features are available or why a write is refused. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const rows: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) =>
        conn.query(
          'SELECT VERSION() AS version, @@version_comment AS versionComment, DATABASE() AS `database`, CURRENT_USER() AS currentUser, @@system_time_zone AS systemTimeZone, @@time_zone AS timeZone, @@sql_mode AS sqlMode, @@read_only AS readOnly',
        ),
    });
    const info = rows[0] ?? {};
    return { ...info, readOnly: Number(info['readOnly']) === 1 };
  },
});
