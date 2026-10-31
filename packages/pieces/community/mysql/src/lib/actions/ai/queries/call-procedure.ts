import { createAction, Property } from '@activepieces/pieces-framework';
import { Connection } from 'promise-mysql';
import { mysqlAuth } from '../../../..';
import { mysqlAi } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlCallProcedureOutputSchema } from '../../../output-schemas';

export const callProcedure = createAction({
  auth: mysqlAuth,
  name: 'mysql_call_procedure',
  outputSchema: mysqlCallProcedureOutputSchema,
  displayName: 'Call Procedure',
  description: 'Calls a stored procedure and returns its result sets and OUT parameters.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Calls a stored procedure. Arguments are the values for its IN and INOUT parameters in order, skipping OUT parameters; returns every result set it selects, the affected-row count and the final OUT and INOUT values by name. Procedure names and parameters come from List Routines. Not idempotent: the effect depends on the procedure.',
    idempotent: false,
  },
  props: {
    procedure: Property.ShortText({
      displayName: 'Procedure',
      description: 'Procedure name, as returned by List Routines. Use database.procedure for one outside the connection database.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for the IN and INOUT parameters, in order. Leave out OUT parameters.',
      required: false,
    }),
  },
  async run(context) {
    const { procedure } = context.propsValue;
    const args = (context.propsValue.args ?? []).map((value) => mysqlAi.toBindValue({ value }));
    return mysqlAi.withConnection({
      auth: context.auth,
      fn: async (conn) => {
        const parameters = await loadParameters({ conn, procedure });
        const inputCount = parameters.filter((parameter) => parameter.mode !== 'OUT').length;
        if (args.length !== inputCount) {
          throw new Error(`Procedure "${procedure}" takes ${inputCount} argument(s) for its IN and INOUT parameters, but ${args.length} were given.`);
        }
        const plan = buildCall({ parameters, args });
        for (const statement of plan.setup) {
          await conn.query(statement.sql, statement.values);
        }
        const result: unknown = await conn.query(`CALL ${sanitizeColumnName(procedure)}(${plan.placeholders.join(', ')})`, plan.values);
        const outParams = await readOutParams({ conn, parameters });
        const parts = Array.isArray(result) ? result : [result];
        const status = parts.find((part) => mysqlAi.isRecord(part));
        return {
          resultSets: parts.filter((part) => Array.isArray(part)),
          affectedRows: mysqlAi.isRecord(status) ? Number(status['affectedRows'] ?? 0) : 0,
          outParams,
        };
      },
    });
  },
});

async function loadParameters({ conn, procedure }: { conn: Connection; procedure: string }): Promise<ProcedureParameter[]> {
  const [schema, name] = procedure.includes('.') ? procedure.split('.', 2) : [null, procedure];
  const rows: Record<string, unknown>[] = await conn.query(
    "SELECT parameter_mode AS mode, parameter_name AS name FROM information_schema.parameters WHERE specific_schema = COALESCE(?, DATABASE()) AND specific_name = ? AND routine_type = 'PROCEDURE' ORDER BY ordinal_position",
    [schema, name],
  );
  return rows.map((row, index) => ({ mode: String(row['mode']), name: String(row['name']), variable: `@ap_param_${index}` }));
}

function buildCall({ parameters, args }: { parameters: ProcedureParameter[]; args: unknown[] }): CallPlan {
  const inputs = parameters.filter((parameter) => parameter.mode !== 'OUT');
  const argFor = (parameter: ProcedureParameter): unknown => args[inputs.indexOf(parameter)];
  return {
    setup: parameters
      .filter((parameter) => parameter.mode !== 'IN')
      .map((parameter) => ({ sql: `SET ${parameter.variable} = ?`, values: [parameter.mode === 'INOUT' ? argFor(parameter) : null] })),
    placeholders: parameters.map((parameter) => (parameter.mode === 'IN' ? '?' : parameter.variable)),
    values: parameters.filter((parameter) => parameter.mode === 'IN').map((parameter) => argFor(parameter)),
  };
}

async function readOutParams({ conn, parameters }: { conn: Connection; parameters: ProcedureParameter[] }): Promise<Record<string, unknown>> {
  const outputs = parameters.filter((parameter) => parameter.mode !== 'IN');
  if (outputs.length === 0) {
    return {};
  }
  const rows: Record<string, unknown>[] = await conn.query(
    `SELECT ${outputs.map((parameter, index) => `${parameter.variable} AS ${sanitizeColumnName(`p${index}`)}`).join(', ')}`,
  );
  const row = rows[0] ?? {};
  return Object.fromEntries(outputs.map((parameter, index) => [parameter.name, row[`p${index}`]]));
}

type ProcedureParameter = {
  mode: string;
  name: string;
  variable: string;
};

type CallPlan = {
  setup: { sql: string; values: unknown[] }[];
  placeholders: string[];
  values: unknown[];
};
