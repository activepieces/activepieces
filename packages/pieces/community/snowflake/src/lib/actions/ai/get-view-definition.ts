import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { viewDefinitionOutputSchema } from '../../common/output-schemas';
import { qualifiedName } from '../../common/sql';

export const getViewDefinitionAction = createAction({
  name: 'get_view_definition',
  classification: 'READ',
  displayName: 'Get View Definition',
  description: 'Get the CREATE VIEW statement (DDL) of a view.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the full CREATE VIEW statement of a view (GET_DDL), to understand how a view is built before querying it. Secure views only return DDL to their owner role. Safe to retry.',
    idempotent: true,
  },
  outputSchema: viewDefinitionOutputSchema,
  auth: snowflakeAuth,
  props: {
    view: Property.ShortText({
      displayName: 'View',
      description: 'View name, optionally qualified as DATABASE.SCHEMA.VIEW.',
      required: true,
    }),
  },
  async run(context) {
    const view = qualifiedName({
      value: context.propsValue.view,
      label: 'View',
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({
          sql: `SELECT GET_DDL('VIEW', ?) AS "ddl"`,
          binds: [view],
          maxRows: 1,
        }),
    });
    return { view, ddl: String(result.rows[0]?.['ddl'] ?? '') };
  },
});
