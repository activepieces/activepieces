import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const captureScreenshot = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'captureScreenshot',
  displayName: 'Capture Screenshot',
  description: 'Capture Screenshot of a URL',
  props: {
    settings: Property.Dropdown({
      displayName: 'Screenshot Settings',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.peekshot.com/api/v1/screenshot-settings',
            headers: {
              'x-api-key': auth as string,
              'Content-Type': 'application/json',
            },
          });

          // Handle the specific API response format
          const responseData = response.body;
          if (
            responseData?.status === 'success' &&
            responseData?.data?.settings
          ) {
            const settings = responseData.data.settings;

            const settingsOptions = settings.map((setting: any) => ({
              label: setting.name,
              value: setting.id,
            }));

            return {
              options: settingsOptions,
            };
          }

          return {
            options: [],
          };
        } catch (error) {
          // Fallback options if API call fails
          return {
            options: [],
          };
        }
      },
    }),
    url: Property.ShortText({ displayName: 'Target URL', required: false }),
  },
  async run({ propsValue, auth }) {
    // Action logic here
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.peekshot.com/api/v1/screenshots/via-saved-settings',
      headers: {
        'x-api-key': auth as string,
        'Content-Type': 'application/json',
      },
      body: {
        url: propsValue.url,
        settingId: propsValue.settings,
      },
    });

    return res.body;
  },
});
