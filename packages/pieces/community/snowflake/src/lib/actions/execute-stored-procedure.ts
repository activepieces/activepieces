import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { legacyProcedureOutputSchema } from '../common/output-schemas';
import { isUserDefined } from '../common/operations';
import { buildCall, parseSignatureArgTypes } from '../common/procedures';
import { qualifiedName } from '../common/sql';

export const executeStoredProcedureAction = createAction({
  name: 'execute_stored_procedure',
  classification: 'WRITE',
  displayName: 'Execute Stored Procedure',
  description: 'Call a stored procedure in Snowflake and return its result.',
  audience: 'human',
  aiMetadata: {
    description:
      'CALLs a stored procedure picked from dropdowns with positional arguments. Human-only; agents use Call Procedure. A procedure may change data on every call.',
    idempotent: false,
  },
  outputSchema: legacyProcedureOutputSchema,
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
        try {
          const result = await withSnowflake({
            auth: toAuthValue(auth),
            statementTimeoutSeconds: 60,
            fn: (session) =>
              session.query({
                sql: `SHOW PROCEDURES IN SCHEMA ${qualifiedName({
                  value: `${database}.${schema}`,
                  maxParts: 2,
                  label: 'Schema',
                })}`,
                maxRows: 5000,
              }),
          });
          return {
            disabled: false,
            options: result.rows.filter(isUserDefined).map((proc) => {
              const value = String(proc['arguments'] ?? proc['name'] ?? '');
              return { label: value, value };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: `Could not load procedures: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
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
    const bareName = procedure_name.includes('(')
      ? procedure_name.substring(0, procedure_name.indexOf('(')).trim()
      : procedure_name.trim();
    const { sql, binds } = buildCall({
      procedure: `${qualifiedName({
        value: `${database}.${schema}`,
        maxParts: 2,
        label: 'Schema',
      })}.${qualifiedName({
        value: bareName,
        maxParts: 1,
        label: 'Procedure',
      })}`,
      args: args ?? [],
      preQualified: true,
      argTypes: parseSignatureArgTypes(procedure_name),
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds }),
    });
    return { result: result.rows };
  },
});
