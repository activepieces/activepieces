import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlAi } from '../../../common/ai';
import { microsoftSqlServerGetServerInfoOutputSchema } from '../../../output-schemas';

export const getServerInfo = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_get_server_info',
  outputSchema: microsoftSqlServerGetServerInfoOutputSchema,
  displayName: 'Get Server Info',
  description: 'Returns the server version, edition and the connection\'s database, login and user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the SQL Server version and edition (engine_edition 5 is Azure SQL Database), server name, collation, the connection database with its compatibility level, the login, database user and default schema, and the server time. Use first to learn which T-SQL features are available. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const result = await pool.request().query<Record<string, unknown>>(
          `SELECT @@VERSION AS version,
                  CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(128)) AS product_version,
                  CAST(SERVERPROPERTY('ProductLevel') AS nvarchar(128)) AS product_level,
                  CAST(SERVERPROPERTY('Edition') AS nvarchar(128)) AS edition,
                  CAST(SERVERPROPERTY('EngineEdition') AS int) AS engine_edition,
                  @@SERVERNAME AS server_name,
                  CAST(SERVERPROPERTY('Collation') AS nvarchar(128)) AS server_collation,
                  DB_NAME() AS [database],
                  (SELECT compatibility_level FROM sys.databases WHERE name = DB_NAME()) AS compatibility_level,
                  SUSER_SNAME() AS login,
                  USER_NAME() AS [user],
                  SCHEMA_NAME() AS default_schema,
                  CONVERT(varchar(40), SYSDATETIMEOFFSET(), 127) AS server_time`
        );
        return result.recordset[0];
      },
    });
  },
});
