import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const getVerificationResultAction = createAction({
  auth: aipriseAuth,
  name: 'get_verification_result',
  displayName: 'Get Identity Verification Result',
  description:
    'Fetches the current status and outcome of a person\'s identity check — whether it is still in progress, approved, or declined.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up the current status and decision (in progress, approved, or declined) of a single identity (KYC) verification by its session ID. Use this to poll or read the outcome of a previously started user verification. Requires the verification session ID. Read-only and idempotent.',
    idempotent: true,
  },
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
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/verify/get_user_verification_result/${session_id}`,
    });
    return result;
  },
});
