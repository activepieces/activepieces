import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerGetViewDefinitionOutputSchema } from '../../../output-schemas';

export const getViewDefinition = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_get_view_definition',
  outputSchema: microsoftSqlServerGetViewDefinitionOutputSchema,
  displayName: 'Get View Definition',
  description: 'Returns the CREATE VIEW statement behind a view.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the T-SQL CREATE VIEW statement of one view, to understand which tables and filters it draws on. View names come from List Views. Fails when the view is encrypted or the login lacks VIEW DEFINITION. Read-only.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    view: Property.ShortText({
      displayName: 'View',
      description: 'View name without the schema, as returned by List Views.',
      required: true,
    }),
  },
  async run(context) {
    const { schema, view } = context.propsValue;
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: view, kinds: ['V'], label: 'View' });
        const result = await pool
          .request()
          .input('name', mssqlCommon.quoteTable(target))
          .query<Record<string, unknown>>('SELECT OBJECT_DEFINITION(OBJECT_ID(@name)) AS definition');
        const definition = result.recordset[0]?.['definition'];
        if (typeof definition !== 'string') {
          throw new Error(`The definition of view "${target.table_schema}.${target.table_name}" is not readable: it is encrypted, or the login lacks VIEW DEFINITION on it.`);
        }
        return { schema: target.table_schema, view: target.table_name, definition };
      },
    });
  },
});
