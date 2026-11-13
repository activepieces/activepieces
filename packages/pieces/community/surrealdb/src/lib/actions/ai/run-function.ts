import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbApi } from '../../common/api';
import { surrealdbRunFunctionOutputSchema } from '../../output-schemas';

export const runFunctionAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_run_function',
  outputSchema: surrealdbRunFunctionOutputSchema,
  displayName: 'Run Function',
  description: 'Runs a custom or built-in SurrealDB function with arguments.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Calls a function by name with positional arguments and returns its result: a custom function defined in the database ("fn::name"; Get Database Info lists them with their arguments) or a built-in one such as "string::uppercase" or "time::now". Arguments keep their JSON types. Not idempotent in general: a custom function may write data.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Function',
      description: 'Function name, e.g. "fn::greet" or "math::sum".',
      required: true,
    }),
    args: Property.Json({
      displayName: 'Arguments',
      description: 'JSON array of positional arguments, e.g. ["Tobie", 33]. Leave empty for none.',
      required: false,
    }),
  },
  async run(context) {
    const { name, args } = context.propsValue;
    if (args !== undefined && !Array.isArray(args)) {
      throw new Error('Arguments must be a JSON array, e.g. ["Tobie", 33].');
    }
    const result = await surrealdbApi.rpc<unknown>({ auth: context.auth, method: 'run', params: [name, null, args ?? []] });
    return { result };
  },
});
