import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
} from '../common';

export const executeStoredProcedureAction = createAction({
  name: 'execute_stored_procedure',
  displayName: 'Execute Stored Procedure',
  description: 'Call a stored procedure in Snowflake and return its result.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    procedure_name: Property.Dropdown({
      auth: snowflakeAuth,
      displayName: 'Stored Procedure',
      description: 'Select the stored procedure to call.',
      refreshers: ['database', 'schema'],
      required: true,
      options: async ({ auth, database, schema }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        if (!database || !schema) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a database and schema first',
          };
        }
        const authValue = auth as typeof auth;
        const connection = configureConnection(authValue.props);
        await connect(connection);
        const result = await execute(
          connection,
          `SHOW PROCEDURES IN SCHEMA ${database}.${schema}`,
          []
        );
        await destroy(connection);
        return {
          disabled: false,
          options: result
            ? (result as Record<string, unknown>[]).map((proc) => ({
                label: String(proc['name'] ?? proc['arguments'] ?? ''),
                value: String(proc['name'] ?? ''),
              }))
            : [],
        };
      },
    }),
    arguments: Property.Array({
      displayName: 'Arguments',
      description:
        'Positional arguments to pass to the stored procedure in order. ' +
        'Leave empty if the procedure takes no arguments.',
      required: false,
    }),
  },
  async run(context) {
    const { database, schema, procedure_name, arguments: args } = context.propsValue;

    const argPlaceholders = args && args.length > 0
      ? (args as string[]).map(() => '?').join(', ')
      : '';

    const sql = `CALL ${database}.${schema}.${procedure_name}(${argPlaceholders})`;
    const binds = args && args.length > 0 ? (args as string[]) : [];

    const connection = configureConnection(context.auth.props);
    await connect(connection);
    try {
      const result = await execute(connection, sql, binds);
      return { result: result ?? null };
    } finally {
      await destroy(connection);
    }
  },
});
