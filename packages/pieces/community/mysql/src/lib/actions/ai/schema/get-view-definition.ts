import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlGetViewDefinitionOutputSchema } from '../../../output-schemas';

export const getViewDefinition = createAction({
  auth: mysqlAuth,
  name: 'mysql_get_view_definition',
  outputSchema: mysqlGetViewDefinitionOutputSchema,
  displayName: 'Get View Definition',
  description: 'Returns the CREATE VIEW statement of a view.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the CREATE VIEW statement behind a view (SHOW CREATE VIEW), to see which tables and joins it reads. View names come from List Views. Read-only.',
    idempotent: true,
  },
  props: {
    view: Property.ShortText({
      displayName: 'View',
      description: 'View name, as returned by List Views. Use database.view for a view outside the connection database.',
      required: true,
    }),
  },
  async run(context) {
    const rows: Record<string, unknown>[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) => conn.query(`SHOW CREATE VIEW ${sanitizeColumnName(context.propsValue.view)}`),
    });
    const row = rows[0] ?? {};
    return {
      view: row['View'],
      definition: row['Create View'],
      characterSetClient: row['character_set_client'],
      collationConnection: row['collation_connection'],
    };
  },
});
