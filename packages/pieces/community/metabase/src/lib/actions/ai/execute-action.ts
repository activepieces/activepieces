import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseExecuteActionOutputSchema } from '../../output-schemas';

export const executeActionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_execute_action',
  outputSchema: metabaseExecuteActionOutputSchema,
  displayName: 'Execute Action',
  description: 'Run a Metabase action (writes to the database).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs a Metabase action, which writes to the connected database (insert, update or delete rows, or custom SQL). Parameter ids come from Get Action. Each call runs the write again.',
    idempotent: false,
  },
  props: {
    actionId: metabaseAiProps.actionId({ required: true }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description:
        'Values keyed by parameter id from Get Action, e.g. {"id": 42, "status": "shipped"}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.executeAction({
      auth,
      actionId: propsValue.actionId,
      body: { parameters: propsValue.parameters ?? {} },
    });
  },
});
