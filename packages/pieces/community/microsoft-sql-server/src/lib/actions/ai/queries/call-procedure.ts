import { createAction, Property } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { mssqlAuth } from '../../../auth';
import { MssqlTable, mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerCallProcedureOutputSchema } from '../../../output-schemas';

export const callProcedure = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_call_procedure',
  outputSchema: microsoftSqlServerCallProcedureOutputSchema,
  displayName: 'Call Procedure',
  description: 'Runs a stored procedure and returns its result sets, OUTPUT parameters and return value.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Executes a stored procedure with named parameters and returns every result set it selects, the final values of its OUTPUT parameters by name, its return value and the rows it affected. Input parameters left out take their declared default, or fail if they have none; OUTPUT parameters are always passed, starting as NULL unless given a value, so pass one where the procedure relies on the default of an OUTPUT parameter. Procedure and parameter names come from List Routines. Not idempotent: the effect depends on the procedure.',
    idempotent: false,
  },
  props: {
    schema: mssqlAiProps.schema,
    procedure: Property.ShortText({
      displayName: 'Procedure',
      description: 'Procedure name without the schema, as returned by List Routines.',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description: 'Parameter names mapped to values, with or without the @, e.g. {"customer_id": 42}. An OUTPUT parameter left out starts as NULL, not its declared default.',
      required: false,
    }),
  },
  async run(context) {
    const { schema, procedure } = context.propsValue;
    const given = Object.fromEntries(
      Object.entries(context.propsValue.parameters ?? {}).map(([name, value]) => [`@${name.replace(/^@/, '')}`.toLowerCase(), value]),
    );
    return mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: procedure, kinds: ['P', 'PC'], label: 'Procedure' });
        const declared = await loadParameters({ pool, target });
        const unknown = Object.keys(given).filter((name) => !declared.some((parameter) => parameter.name.toLowerCase() === name));
        if (unknown.length > 0) {
          const known = declared.map((parameter) => parameter.name).join(', ') || 'none';
          throw new Error(`Procedure "${target.table_schema}.${target.table_name}" has no parameter ${unknown.join(', ')}. Its parameters: ${known}.`);
        }
        const plan = buildCall({ target, declared, given });
        const result = await mssqlAi.bind({ request: pool.request(), params: plan.params }).query<Record<string, unknown>>(plan.sql);
        const sets = result.recordsets.map((set) => [...set]);
        const status = sets[sets.length - 1]?.[0] ?? {};
        const counts = result.rowsAffected ?? [];
        return {
          result_sets: sets.slice(0, -1),
          output_parameters: Object.fromEntries(plan.outputs.map((name, index) => [name, status[`o${index}`]])),
          return_value: status['return_value'] ?? null,
          rows_affected: counts.reduce((a, b) => a + b, 0),
        };
      },
    });
  },
});

async function loadParameters({ pool, target }: { pool: sql.ConnectionPool; target: MssqlTable }): Promise<Parameter[]> {
  const result = await pool
    .request()
    .input('name', mssqlCommon.quoteTable(target))
    .query<Record<string, unknown>>(
      `SELECT p.name, t.name AS type, SCHEMA_NAME(t.schema_id) AS type_schema, t.is_user_defined,
              p.max_length, p.precision, p.scale, p.is_output
       FROM sys.parameters p
       JOIN sys.types t ON t.user_type_id = p.user_type_id
       WHERE p.object_id = OBJECT_ID(@name) AND p.parameter_id > 0 ORDER BY p.parameter_id`
    );
  return result.recordset.map((row) => ({
    name: String(row['name']),
    dataType: row['is_user_defined']
      ? `${mssqlCommon.quoteId(String(row['type_schema']))}.${mssqlCommon.quoteId(String(row['type']))}`
      : mssqlAi.typeLabel({
          type: String(row['type']),
          maxLength: Number(row['max_length']),
          precision: Number(row['precision']),
          scale: Number(row['scale']),
        }),
    isOutput: Boolean(row['is_output']),
  }));
}

function buildCall({ target, declared, given }: { target: MssqlTable; declared: Parameter[]; given: Record<string, unknown> }): CallPlan {
  const outputs = declared.filter((parameter) => parameter.isOutput);
  const inputs = declared.filter((parameter) => !parameter.isOutput && parameter.name.toLowerCase() in given);
  const declarations = outputs.map((parameter, index) => {
    const initial = parameter.name.toLowerCase() in given ? `@oi${index}` : 'NULL';
    return `DECLARE @o${index} ${parameter.dataType} = ${initial};`;
  });
  const args = [
    ...inputs.map((parameter, index) => `${parameter.name} = @i${index}`),
    ...outputs.map((parameter, index) => `${parameter.name} = @o${index} OUTPUT`),
  ];
  const selects = ['@ap_return AS return_value', ...outputs.map((_, index) => `@o${index} AS o${index}`)];
  return {
    sql: [
      'SET NOCOUNT ON;',
      'DECLARE @ap_return int;',
      ...declarations,
      'SET NOCOUNT OFF;',
      `EXEC @ap_return = ${mssqlCommon.quoteTable(target)}${args.length > 0 ? ` ${args.join(', ')}` : ''};`,
      'SET NOCOUNT ON;',
      `SELECT ${selects.join(', ')};`,
    ].join('\n'),
    params: {
      ...Object.fromEntries(inputs.map((parameter, index) => [`i${index}`, given[parameter.name.toLowerCase()]])),
      ...Object.fromEntries(
        outputs
          .map((parameter, index) => [`oi${index}`, given[parameter.name.toLowerCase()]] as const)
          .filter(([, value]) => value !== undefined),
      ),
    },
    outputs: outputs.map((parameter) => parameter.name.replace(/^@/, '')),
  };
}

type Parameter = {
  name: string;
  dataType: string;
  isOutput: boolean;
};

type CallPlan = {
  sql: string;
  params: Record<string, unknown>;
  outputs: string[];
};
