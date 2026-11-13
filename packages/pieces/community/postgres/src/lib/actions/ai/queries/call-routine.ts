import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresCallRoutineOutputSchema } from '../../../output-schemas';

export const callRoutine = createAction({
  auth: postgresAuth,
  name: 'postgres_call_routine',
  outputSchema: postgresCallRoutineOutputSchema,
  displayName: 'Call Routine',
  description: 'Calls a function or procedure and returns what it produces.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Calls a user-defined function (SELECT * FROM fn(...)) or procedure (CALL proc(...)) with the given arguments in order and returns the rows it produces: a function\'s result, or a procedure\'s INOUT/OUT values. Routine names and their argument lists come from List Routines. Not idempotent: the routine may change data.',
    idempotent: false,
  },
  props: {
    routine: Property.ShortText({
      displayName: 'Routine',
      description: 'Function or procedure name as returned by List Routines, written schema.name. A bare name is looked up on the search path.',
      required: true,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for the routine\'s arguments, in order. Leave out trailing arguments that have defaults.',
      required: false,
    }),
  },
  async run(context) {
    const { routine } = context.propsValue;
    const args = context.propsValue.args ?? [];
    const { schema, name } = postgresAi.splitName({ name: routine });
    return postgresAi.withClient({
      auth: context.auth,
      fn: async (client) => {
        const kinds = await client.query<{ kind: string }>(
          `SELECT DISTINCT p.prokind AS kind FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = $1 AND p.prokind IN ('f', 'p') AND (n.nspname = $2::text OR ($2::text IS NULL AND n.nspname = ANY(current_schemas(false))))`,
          [name, schema],
        );
        const found = kinds.rows.map((row) => row.kind);
        if (found.length === 0) {
          throw new Error(`No function or procedure named "${routine}". Use List Routines to find it, written schema.name.`);
        }
        if (found.length > 1) {
          throw new Error(`"${routine}" names both a function and a procedure; write it as schema.name to pick one.`);
        }
        const call = `${postgresAi.quoteName({ name: routine })}(${args.map((_, index) => `$${index + 1}`).join(', ')})`;
        const result = await client.query(found[0] === 'p' ? `CALL ${call}` : `SELECT * FROM ${call}`, args);
        return { kind: found[0] === 'p' ? 'procedure' : 'function', rows: result.rows, rowCount: result.rows.length };
      },
    });
  },
});
