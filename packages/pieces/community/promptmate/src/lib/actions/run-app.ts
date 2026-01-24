import { createAction, Property } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAppDropdownOptions } from '../common';

export const runApp = createAction({
  auth: promptmateAuth,
  name: 'run_app',
  displayName: 'Run PromptMate App',
  description: 'Runs a PromptMate app with the specified data',
  props: {
    appId: Property.Dropdown({
      auth: promptmateAuth,
      displayName: 'App',
      description: 'Select the PromptMate app to run',
      required: true,
      refreshers: [],
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
    data: Property.Array({
      displayName: 'Data',
      description: 'Array of data objects to process. Each object must contain the required data fields for the selected app.',
      required: true,
    }),
    callBackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL to which the result of the job will be sent (optional)',
      required: false,
    }),
    noMailOnFinish: Property.Checkbox({
      displayName: 'Disable Email Notification',
      description: 'Send an email to the user when the job has finished',
      required: false,
      defaultValue: true,
    }),
    config: Property.Object({
      displayName: 'Configuration',
      description: 'Configuration settings for the job (language, country, etc.)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { appId, data, callBackUrl, noMailOnFinish, config } = propsValue;

    const requestBody: any = {
      appId,
      data,
    };

    if (callBackUrl) {
      requestBody.callBackUrl = callBackUrl;
    }

    if (noMailOnFinish !== undefined) {
      requestBody.noMailOnFinish = noMailOnFinish;
    }

    if (config) {
      requestBody.config = config;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.promptmate.io/v1/app-jobs',
      headers: {
        'x-api-key': auth.secret_text,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
