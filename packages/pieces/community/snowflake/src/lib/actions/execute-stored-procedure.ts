import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
  SnowflakeAuthValue,
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
        const connection = configureConnection(auth as SnowflakeAuthValue);
        await connect(connection);
        let result;
        try {
          result = await execute(
            connection,
            `SHOW PROCEDURES IN SCHEMA ${database}.${schema}`,
            []
          );
        } finally {
          await destroy(connection);
        }
        return {
          disabled: false,
          options: result
            ? (result as Record<string, unknown>[]).map((proc) => ({
                label: String(proc['arguments'] ?? proc['name'] ?? ''),
                value: String(proc['arguments'] ?? proc['name'] ?? ''),
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
    const {
      database,
      schema,
      procedure_name,
      arguments: args,
    } = context.propsValue;

    // procedure_name is the full signature string (e.g. "MY_PROC(NUMBER) RETURN VARCHAR")
    // Extract just the bare name before the first '('
    const bareName = procedure_name.includes('(')
      ? procedure_name.substring(0, procedure_name.indexOf('(')).trim()
      : procedure_name.trim();

    const argPlaceholders =
      args && args.length > 0
        ? (args as string[]).map(() => '?').join(', ')
        : '';

    const sql = `CALL ${database}.${schema}.${bareName}(${argPlaceholders})`;
    const binds = args && args.length > 0 ? (args as string[]) : [];

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, binds);
      return { result: result ?? null };
    } finally {
      await destroy(connection);
    }
  },
});
