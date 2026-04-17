import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const getAdditionalUserInfoAction = createAction({
  auth: aipriseAuth,
  name: 'get_additional_user_info',
  displayName: "Get Person's Additional Info",
  description:
    "Fetches supplementary information collected from the person during a verification — anything beyond the primary identity fields, such as follow-up answers, extra documents, or custom form data.",
  props: {
    session_id: Property.ShortText({
      displayName: 'Verification Session ID',
      description:
        'The ID of the verification to look up. You can get this from the output of the **Start Identity Verification** action',
      required: true,
    }),
  },
  async run(context) {
    const { session_id } = context.propsValue;
    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/verify/get_additional_user_info_from_request/${session_id}`,
    });
  },
});
