import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlListViewsOutputSchema } from '../../../output-schemas';

export const listViews = createAction({
  auth: mysqlAuth,
  name: 'mysql_list_views',
  outputSchema: mysqlListViewsOutputSchema,
  displayName: 'List Views',
  description: 'Lists the views in a database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the views in a database with whether each is updatable and its security type, optionally filtered by a LIKE pattern on the name. Views can be read with Find Rows like tables; use Get View Definition for the SQL behind one. Read-only.',
    idempotent: true,
  },
  props: {
    database: mysqlAiProps.database,
    namePattern: mysqlAiProps.namePattern,
  },
  async run(context) {
    const { database, namePattern } = context.propsValue;
    const hasPattern = namePattern !== undefined && namePattern !== '';
    const views: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: async (conn) => {
        const schema = await mysqlAi.resolveDatabase({ conn, database });
        return conn.query(
          `SELECT table_name AS name, is_updatable AS updatable, security_type AS securityType, definer AS definer FROM information_schema.views WHERE table_schema = ?${hasPattern ? ' AND table_name LIKE ?' : ''} ORDER BY table_name`,
          hasPattern ? [schema, namePattern] : [schema],
        );
      },
    });
    return {
      views: views.map((view) => ({ ...view, updatable: view['updatable'] === 'YES' })),
      count: views.length,
    };
  },
});
