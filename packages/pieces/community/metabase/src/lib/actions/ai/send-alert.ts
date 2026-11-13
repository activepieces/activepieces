import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSendAlertOutputSchema } from '../../output-schemas';

export const sendAlertAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_send_alert',
  outputSchema: metabaseSendAlertOutputSchema,
  displayName: 'Send Alert',
  description: 'Send a question alert now.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends an existing alert to its recipients immediately, regardless of its schedule and condition. Each call sends again.',
    idempotent: false,
  },
  props: {
    alertId: metabaseAiProps.alertId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.sendAlert({
      auth,
      alertId: propsValue.alertId,
      body: {},
    });
    return { sent: true, alertId: propsValue.alertId };
  },
});
