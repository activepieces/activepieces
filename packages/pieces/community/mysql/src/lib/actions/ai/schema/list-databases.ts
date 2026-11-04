import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlListDatabasesOutputSchema } from '../../../output-schemas';

export const listDatabases = createAction({
  auth: mysqlAuth,
  name: 'mysql_list_databases',
  outputSchema: mysqlListDatabasesOutputSchema,
  displayName: 'List Databases',
  description: 'Lists the databases the connection user can see.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the databases visible to the connection user (SHOW DATABASES), optionally filtered by a LIKE pattern. Use to find the database name that Describe Table, List Views and List Routines take. Read-only.',
    idempotent: true,
  },
  props: {
    namePattern: mysqlAiProps.namePattern,
  },
  async run(context) {
    const { namePattern } = context.propsValue;
    const hasPattern = namePattern !== undefined && namePattern !== '';
    const rows: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) => conn.query(hasPattern ? 'SHOW DATABASES LIKE ?' : 'SHOW DATABASES', hasPattern ? [namePattern] : []),
    });
    const databases = rows.map((row) => String(Object.values(row)[0]));
    return { databases, count: databases.length };
  },
});
