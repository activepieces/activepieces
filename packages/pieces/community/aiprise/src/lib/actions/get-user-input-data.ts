import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const getUserInputDataAction = createAction({
  auth: aipriseAuth,
  name: 'get_user_input_data',
  displayName: 'Get Person\'s Submitted Verification Data',
  description:
    'Returns the information the person entered and the documents they uploaded during their identity check (e.g. name, date of birth, ID document details).',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the raw data a person submitted during an identity verification — the details they typed and the documents they uploaded — for a single verification session. Use this when you need the person\'s submitted input itself rather than the pass/fail decision (see Get Identity Verification Result for the outcome). Requires the verification session ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    session_id: Property.ShortText({
      displayName: 'Verification Session ID',
      description:
        'The ID of the verification to retrieve data from. You can get this from the output of the **Start Identity Verification** action, or from the **session_id** field in any webhook payload from AiPrise.',
      required: true,
    }),
  },
  async run(context) {
    const { session_id } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/verify/get_user_input_data_from_request/${session_id}`,
    });
    return result;
  },
});
