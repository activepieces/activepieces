import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerListRoutinesOutputSchema } from '../../../output-schemas';

export const listRoutines = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_list_routines',
  outputSchema: microsoftSqlServerListRoutinesOutputSchema,
  displayName: 'List Routines',
  description: 'Lists stored procedures and functions with their parameters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the stored procedures and user-defined functions in the connection database, optionally filtered by schema, kind and name pattern: schema, name, kind (PROCEDURE, SCALAR_FUNCTION, TABLE_FUNCTION) and the parameters in order with type and whether each is OUTPUT. Procedures run through Call Procedure; functions are used inside Run Select Query. Read-only.',
    idempotent: true,
  },
  props: {
    schema: {
      ...mssqlAiProps.schema,
      description: 'Only list routines in this schema. Leave empty for all schemas.',
    },
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Only list this kind of routine. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Procedure', value: 'PROCEDURE' },
          { label: 'Scalar function', value: 'SCALAR_FUNCTION' },
          { label: 'Table function', value: 'TABLE_FUNCTION' },
        ],
      },
    }),
    namePattern: mssqlAiProps.namePattern,
  },
  async run(context) {
    const { schema, kind, namePattern } = context.propsValue;
    if (kind !== undefined && kind !== null && !KINDS.some((entry) => entry === kind)) {
      throw new Error(`Kind must be one of: ${KINDS.join(', ')}.`);
    }
    const rows = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const request = pool
          .request()
          .input('schema', schema || null)
          .input('kind', kind || null)
          .input('pattern', namePattern || null);
        const result = await request.query<Record<string, unknown>>(
          `SELECT o.object_id, SCHEMA_NAME(o.schema_id) AS [schema], o.name,
                  CASE WHEN o.type IN ('P', 'PC') THEN 'PROCEDURE'
                       WHEN o.type IN ('FN', 'FS') THEN 'SCALAR_FUNCTION'
                       ELSE 'TABLE_FUNCTION' END AS kind,
                  p.name AS parameter_name, TYPE_NAME(p.user_type_id) AS parameter_type,
                  p.max_length, p.precision, p.scale, p.is_output
           FROM sys.objects o
           LEFT JOIN sys.parameters p ON p.object_id = o.object_id AND p.parameter_id > 0
           WHERE o.type IN ('P', 'PC', 'FN', 'FS', 'IF', 'TF', 'FT') AND o.is_ms_shipped = 0
             AND (@schema IS NULL OR SCHEMA_NAME(o.schema_id) = @schema)
             AND (@pattern IS NULL OR o.name LIKE @pattern)
             AND (@kind IS NULL OR @kind = CASE WHEN o.type IN ('P', 'PC') THEN 'PROCEDURE'
                                              WHEN o.type IN ('FN', 'FS') THEN 'SCALAR_FUNCTION'
                                              ELSE 'TABLE_FUNCTION' END)
           ORDER BY [schema], o.name, p.parameter_id`
        );
        return result.recordset;
      },
    });
    const routines = groupRoutines({ rows });
    return { routines, count: routines.length };
  },
});

function groupRoutines({ rows }: { rows: Record<string, unknown>[] }): Routine[] {
  const ids = [...new Set(rows.map((row) => Number(row['object_id'])))];
  return ids.map((id) => {
    const members = rows.filter((row) => Number(row['object_id']) === id);
    const first = members[0];
    return {
      schema: String(first['schema']),
      name: String(first['name']),
      kind: String(first['kind']),
      parameters: members
        .filter((row) => row['parameter_name'] !== null)
        .map((row) => ({
          name: String(row['parameter_name']),
          data_type: mssqlAi.typeLabel({
            type: String(row['parameter_type']),
            maxLength: Number(row['max_length']),
            precision: Number(row['precision']),
            scale: Number(row['scale']),
          }),
          is_output: Boolean(row['is_output']),
        })),
    };
  });
}

const KINDS = ['PROCEDURE', 'SCALAR_FUNCTION', 'TABLE_FUNCTION'] as const;

type Routine = {
  schema: string;
  name: string;
  kind: string;
  parameters: { name: string; data_type: string; is_output: boolean }[];
};
