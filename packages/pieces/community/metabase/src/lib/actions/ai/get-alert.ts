import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetAlertOutputSchema } from '../../output-schemas';

export const getAlertAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_alert',
  outputSchema: metabaseGetAlertOutputSchema,
  displayName: 'Get Alert',
  description: 'Get a question alert by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one alert with its question, condition, schedule, channels and recipients.',
    idempotent: true,
  },
  props: {
    alertId: metabaseAiProps.alertId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getAlert({
      auth,
      alertId: propsValue.alertId,
    });
  },
});
