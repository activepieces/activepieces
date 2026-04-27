import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getBusinessInputDataAction = createAction({
  auth: aipriseAuth,
  name: 'get_business_input_data',
  displayName: "Get Business's Submitted Verification Data",
  description:
    'Returns the company information provided during a business verification — such as company name, registration number, directors, and ownership details.',
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
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/verify/get_business_data_from_request/${session_id}`,
    });
    return result;
  },
});
