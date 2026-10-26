import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetUserUsageOutputSchema } from '../../output-schemas';

export const getUserUsage = createAction({
  auth: jotformAuth,
  name: 'jotform_get_user_usage',
  outputSchema: jotformGetUserUsageOutputSchema,
  classification: 'READ',
  displayName: 'Get User Usage',
  description: "Get the connected account's submission and upload usage against its plan limits.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the connected account's current submission, upload and form usage alongside its plan limits, e.g. to check whether the account is near its cap.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/usage',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
