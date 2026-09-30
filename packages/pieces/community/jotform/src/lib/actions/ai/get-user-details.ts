import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetUserDetailsOutputSchema } from '../../output-schemas';

export const getUserDetails = createAction({
  auth: jotformAuth,
  name: 'jotform_get_user_details',
  outputSchema: jotformGetUserDetailsOutputSchema,
  classification: 'READ',
  displayName: 'Get User Details',
  description: "Get the connected account's account info.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the connected Jotform account's profile info: username, email, name, account type, time zone and avatar URL.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
