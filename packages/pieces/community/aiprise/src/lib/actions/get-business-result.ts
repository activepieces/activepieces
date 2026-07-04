import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const getBusinessResultAction = createAction({
  auth: aipriseAuth,
  name: 'get_business_verification_result',
  displayName: 'Get Business Verification Result',
  description:
    "Fetches the current status and outcome of a company's background check — whether it is still running, approved, or declined.",
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up the current status and decision (running, approved, or declined) of a single business (KYB) verification by its session ID. Use this to poll or read the outcome of a previously started business verification. Requires the verification session ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    session_id: Property.ShortText({
      displayName: 'Verification Session ID',
      description:
        'The ID of the business verification to look up. You can get this from the output of the **Start Business Verification** action, or from the **session_id** field in any webhook payload from AiPrise.',
      required: true,
    }),
  },
  async run(context) {
    const { session_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/verify/get_business_verification_result/${session_id}`,
    });
    return result;
  },
});
