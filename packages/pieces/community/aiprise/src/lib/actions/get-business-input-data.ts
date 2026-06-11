import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const getBusinessInputDataAction = createAction({
  auth: aipriseAuth,
  name: 'get_business_input_data',
  displayName: "Get Business's Submitted Verification Data",
  description:
    'Returns the company information provided during a business verification — such as company name, registration number, directors, and ownership details.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the company data submitted for a single business verification session — name, registration number, directors, ownership, etc. Use this when you need the business\'s submitted input itself rather than the pass/fail decision (see Get Business Verification Result for the outcome). Requires the verification session ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    session_id: Property.ShortText({
      displayName: 'Verification Session ID',
      description:
        'The ID of the business verification to retrieve data from. You can get this from the output of the **Start Business Verification** action, or from the **session_id** field in any webhook payload from AiPrise.',
      required: true,
    }),
  },
  async run(context) {
    const { session_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/verify/get_business_data_from_request/${session_id}`,
    });
    return result;
  },
});
