import { createAction } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listApps = createAction({
  auth: promptmateAuth,
  name: 'list_apps',
  displayName: 'List Apps',
  description: 'Retrieve a list of available apps',
  audience: 'both',
  aiMetadata: { description: 'Lists all PromptMate apps available to the authenticated account, returning each app id, name, credit estimate, and its data fields. Use it to discover which app to run or to look up an appId before calling run, get-job-status, get-app-details, or get-last-results. Read-only and safe to repeat.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{
      appId: string;
      appName: string;
      creditEstimate: number;
      dataFields: string[];
    }[]>({
      method: HttpMethod.GET,
      url: 'https://api.promptmate.io/v1/apps',
      headers: {
        'x-api-key': auth.secret_text,
      },
    });

    return response.body;
  },
});
