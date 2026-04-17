import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getVerificationResultAction = createAction({
  auth: aipriseAuth,
  name: 'get_verification_result',
  displayName: 'Get Identity Verification Result',
  description:
    'Fetches the current status and outcome of a person\'s identity check — whether it is still in progress, approved, or declined.',
  props: {
    session_id: Property.ShortText({
      displayName: 'Verification Session ID',
      description:
        'The ID of the specific verification to look up. You can get this from the output of the **Start Identity Verification** action, or from the **session_id** field in any webhook payload from AiPrise.',
      required: true,
    }),
  },
  async run(context) {
    const { session_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/verify/get_user_verification_result/${session_id}`,
    });
    return result;
  },
});
