import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlListProcessesOutputSchema } from '../../../output-schemas';

export const listProcesses = createAction({
  auth: mysqlAuth,
  name: 'mysql_list_processes',
  outputSchema: mysqlListProcessesOutputSchema,
  displayName: 'List Processes',
  description: 'Lists the connections running on the server and what each is doing.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists server connections, longest-running first: id, user, host, database, command, seconds in the current state, state and the statement being run. Without the PROCESS privilege only the connection user\'s own sessions are listed. Use to find long-running or blocking queries. Read-only.',
    idempotent: true,
  },
  props: {
    limit: mysqlAiProps.limit,
  },
  async run(context) {
    const max = mysqlAi.boundedInteger({ value: context.propsValue.limit, defaultValue: mysqlAi.READ_DEFAULT_LIMIT, min: 1, max: mysqlAi.READ_MAX_LIMIT, label: 'Limit' });
    const processes: unknown[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) =>
        conn.query(
          'SELECT id, user, host, db AS `database`, command, time AS seconds, state, info AS statement FROM information_schema.processlist ORDER BY time DESC LIMIT ?',
          [max],
        ),
    });
    return { processes, count: processes.length };
  },
});
