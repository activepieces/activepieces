import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../common/auth';

export const getAdditionalUserInfoAction = createAction({
  auth: aipriseAuth,
  name: 'get_additional_user_info',
  displayName: "Get Person's Additional Info",
  description:
    "Fetches supplementary information collected from the person during a verification — anything beyond the primary identity fields, such as follow-up answers, extra documents, or custom form data.",
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves supplementary information gathered from a person during an identity verification — anything beyond the core identity fields, such as follow-up answers, extra documents, or custom form data — for a single session. Use when the primary submitted data (Get Person\'s Submitted Verification Data) is not enough. Requires the verification session ID. Read-only and idempotent.',
    idempotent: true,
  },
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
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/verify/get_additional_user_info_from_request/${session_id}`,
    });
  },
});
