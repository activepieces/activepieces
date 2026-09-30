import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetUserSettingsOutputSchema } from '../../output-schemas';

export const getUserSettings = createAction({
  auth: jotformAuth,
  name: 'jotform_get_user_settings',
  outputSchema: jotformGetUserSettingsOutputSchema,
  classification: 'READ',
  displayName: 'Get User Settings',
  description: "Get the connected account's account settings.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the connected account's account settings as a key/value map. Use Get User Setting by Key to read a single one.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/settings',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
