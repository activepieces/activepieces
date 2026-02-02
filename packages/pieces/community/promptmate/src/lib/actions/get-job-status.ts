import { createAction, Property } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAppDropdownOptions } from '../common';

export const getJobStatus = createAction({
  auth: promptmateAuth,
  name: 'get_job_status',
  displayName: 'Get Job Status and Result',
  description: 'Retrieve the status and results of a PromptMate app job',
  props: {
    appId: Property.Dropdown({
      displayName: 'App',
      description: 'Select the app for which to get job status',
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
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The ID of the job to check',
      required: true,
    }),
    onlyDefaultResultFields: Property.Checkbox({
      displayName: 'Only Default Result Fields',
      description: 'Return only the default result fields',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { appId, jobId, onlyDefaultResultFields } = propsValue;

    const queryParams: Record<string, string> = {
      appId,
      jobId,
    };

    if (onlyDefaultResultFields !== undefined) {
      queryParams['onlyDefaultResultFields'] = onlyDefaultResultFields.toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.promptmate.io/v1/app-jobs',
      headers: {
        'x-api-key': auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
