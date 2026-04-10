import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const runUserAmlCheckAction = createAction({
  auth: aipriseAuth,
  name: 'run_user_aml_check',
  displayName: 'Check Person for Sanctions & AML',
  description:
    'Screens an individual against global sanctions lists, checks whether they are a Politically Exposed Person (PEP), and scans for adverse news coverage — all in one request.',
  props: {
    user_id: Property.ShortText({
      displayName: 'Your User Reference',
      description:
        'The identifier you used for this person when you started their identity verification (the same value you passed as **Your User Reference** in the **Start Identity Verification** action).',
      required: true,
    }),
  },
  async run(context) {
    const { user_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/run_user_aml_check',
      body: { user_id },
    });
    return result;
  },
});
