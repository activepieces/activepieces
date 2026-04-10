import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const runEmailCheckAction = createAction({
  auth: aipriseAuth,
  name: 'run_email_check',
  displayName: 'Check Email Address for Fraud',
  description:
    'Analyses an email address for fraud risk — including whether it is from a disposable/temporary domain, whether the domain is legitimate, and an overall risk score.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description:
        'The email address to analyse (e.g. user@example.com). AiPrise will check whether the domain is real, whether it is a known throwaway address, and assign a fraud risk score.',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/run_email_check',
      body: { email },
    });
    return result;
  },
});
