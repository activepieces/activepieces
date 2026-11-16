import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioGetAppEmailConfigurationOutputSchema } from '../../../output-schemas';

export const getAppEmailConfigurationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_email_configuration',
  outputSchema: podioGetAppEmailConfigurationOutputSchema,
  displayName: 'Get App Email Configuration',
  description: 'Gets how emails sent to an app become items.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the email-to-item configuration of one Podio app: whether attachments are kept and which app field receives the subject, body, contact or sender of an incoming email. The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getAppEmailConfiguration({ auth, appId: propsValue.appId });
  },
});
