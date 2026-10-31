import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerListSessionsOutputSchema } from '../../../output-schemas';

export const listSessions = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_list_sessions',
  outputSchema: microsoftSqlServerListSessionsOutputSchema,
  displayName: 'List Sessions',
  description: 'Lists the user sessions on the server and what each is running.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists user sessions, longest-running request first: session id, login, host, program, database, status, the running command, wait type, the session blocking it, elapsed and CPU milliseconds, and the statement text. Without VIEW SERVER STATE (VIEW DATABASE STATE on Azure SQL) only the connection\'s own session is listed. Use to find long-running or blocked queries. Read-only.',
    idempotent: true,
  },
  props: {
    limit: mssqlAiProps.limit,
  },
  async run(context) {
    const max = mssqlAi.boundedInteger({ value: context.propsValue.limit, defaultValue: mssqlAi.READ_DEFAULT_LIMIT, min: 1, max: mssqlAi.READ_MAX_LIMIT, label: 'Limit' });
    const sessions = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const result = await pool
          .request()
          .input('limit', max)
          .query<Record<string, unknown>>(
            `SELECT TOP (@limit) s.session_id, s.login_name, s.host_name, s.program_name,
                    DB_NAME(s.database_id) AS [database], s.status, r.command, r.wait_type,
                    r.blocking_session_id, r.total_elapsed_time AS elapsed_ms, r.cpu_time AS cpu_ms,
                    t.text AS sql_text, CONVERT(varchar(33), s.login_time, 126) AS login_time,
                    CAST(CASE WHEN s.session_id = @@SPID THEN 1 ELSE 0 END AS bit) AS is_current
             FROM sys.dm_exec_sessions s
             LEFT JOIN sys.dm_exec_requests r ON r.session_id = s.session_id
             OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
             WHERE s.is_user_process = 1
             ORDER BY r.total_elapsed_time DESC, s.session_id`
          );
        return result.recordset;
      },
    });
    return { sessions, count: sessions.length };
  },
});
