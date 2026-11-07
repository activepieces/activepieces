import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetActionOutputSchema } from '../../output-schemas';

export const getActionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_action',
  outputSchema: metabaseGetActionOutputSchema,
  displayName: 'Get Action',
  description: 'Get a Metabase action by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Metabase action with its type, query and parameters (the parameter ids Execute Action expects).',
    idempotent: true,
  },
  props: {
    actionId: metabaseAiProps.actionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getAction({
      auth,
      actionId: propsValue.actionId,
    });
  },
});
