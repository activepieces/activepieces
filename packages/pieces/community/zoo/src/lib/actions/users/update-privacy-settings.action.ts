import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updatePrivacySettingsAction = createAction({
  name: 'update_privacy_settings',
  displayName: 'Update Privacy Settings',
  description: 'Update your user privacy settings',
  audience: 'both',
  aiMetadata: { description: 'Replace the privacy settings for the authenticated Zoo user with a supplied settings object (e.g. data-retention or training-use preferences). Applying the same settings repeatedly yields the same state (idempotent). Read current values first with the get privacy settings action.', idempotent: true },
  auth: zooAuth,
  // category: 'Users',
  props: {
    settings: Property.Object({
      displayName: 'Privacy Settings',
      required: true,
      description: 'The new privacy settings to apply',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: 'https://api.zoo.dev/user/privacy',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      body: propsValue.settings,
    });
    return response.body;
  },
});
