import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getPrivacySettingsAction = createAction({
  name: 'get_privacy_settings',
  displayName: 'Get Privacy Settings',
  description: 'Get your user privacy settings',
  audience: 'both',
  aiMetadata: { description: 'Read the privacy settings for the authenticated Zoo user, such as whether generated data may be used for training. Read-only and repeatable. Pair with the update privacy settings action to change these values.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/privacy',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
