import { createAction } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { mysqlListRoutinesOutputSchema } from '../../../output-schemas';

export const listRoutines = createAction({
  auth: mysqlAuth,
  name: 'mysql_list_routines',
  outputSchema: mysqlListRoutinesOutputSchema,
  displayName: 'List Routines',
  description: 'Lists the stored procedures and functions in a database with their parameters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists stored procedures and functions in a database, each with its type, return type (functions), comment and ordered parameters (mode, name, type), optionally filtered by a LIKE pattern on the name. Use to find a procedure and its argument order for Call Procedure. Read-only.',
    idempotent: true,
  },
  props: {
    database: mysqlAiProps.database,
    namePattern: mysqlAiProps.namePattern,
  },
  async run(context) {
    const { database, namePattern } = context.propsValue;
    const hasPattern = namePattern !== undefined && namePattern !== '';
    const { routines, parameters } = await mysqlAi.withConnection({
      auth: context.auth,
      fn: async (conn) => {
        const schema = await mysqlAi.resolveDatabase({ conn, database });
        const routineRows: Record<string, unknown>[] = await conn.query(
          `SELECT routine_name AS name, routine_type AS type, dtd_identifier AS returns, routine_comment AS comment FROM information_schema.routines WHERE routine_schema = ?${hasPattern ? ' AND routine_name LIKE ?' : ''} ORDER BY routine_name`,
          hasPattern ? [schema, namePattern] : [schema],
        );
        const parameterRows: Record<string, unknown>[] = await conn.query(
          'SELECT specific_name AS routine, routine_type AS routineType, parameter_mode AS mode, parameter_name AS name, dtd_identifier AS type FROM information_schema.parameters WHERE specific_schema = ? AND ordinal_position > 0 ORDER BY specific_name, ordinal_position',
          [schema],
        );
        return { routines: routineRows, parameters: parameterRows };
      },
    });
    const result = routines.map((routine) => ({
      ...routine,
      parameters: parameters
        .filter((parameter) => parameter['routine'] === routine['name'] && parameter['routineType'] === routine['type'])
        .map((parameter) => ({ mode: parameter['mode'], name: parameter['name'], type: parameter['type'] })),
    }));
    return { routines: result, count: result.length };
  },
});
