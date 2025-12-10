import { createAction, Property } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAppDropdownOptions } from '../common';

export const getAppDetails = createAction({
  auth: promptmateAuth,
  name: 'get_app_details',
  displayName: 'Get App Details',
  description: 'Retrieve detailed information about a specific PromptMate app',
  props: {
    appId: Property.Dropdown({
      displayName: 'App',
      description: 'Select the app to get details for',
      required: true,
      refreshers: [],
      auth: promptmateAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            options: [],
            disabled: true,
          };
        }
        return await getAppDropdownOptions(auth.secret_text);
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { appId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.promptmate.io/v1/app',
      headers: {
        'x-api-key': auth.secret_text,
      },
      queryParams: {
        appId,
      },
    });

    return response.body;
  },
});
