import { createAction, Property } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAppDropdownOptions } from '../common';

export const getLastResults = createAction({
  auth: promptmateAuth,
  name: 'get_last_results',
  displayName: 'Get Last Result Rows',
  description: 'Retrieve the last result rows of a PromptMate app for examples or testing',
  props: {
    appId: Property.Dropdown({
      displayName: 'App',
      description: 'Select the app to get last results for',
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
    onlyDefaultResultFields: Property.Checkbox({
      displayName: 'Only Default Result Fields',
      description: 'Return only the default result fields',
      required: false,
      defaultValue: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of result rows to return',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    const { appId, onlyDefaultResultFields, limit } = propsValue;

    const queryParams: Record<string, string> = {
      appId,
    };

    if (onlyDefaultResultFields !== undefined) {
      queryParams['onlyDefaultResultFields'] = onlyDefaultResultFields.toString();
    }

    if (limit !== undefined) {
      queryParams['limit'] = limit.toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.promptmate.io/v1/app-results',
      headers: {
        'x-api-key': auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
