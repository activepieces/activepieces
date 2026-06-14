import { createAction } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listProjects = createAction({
  auth: promptmateAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Retrieve a list of available PromptMate projects',
  audience: 'both',
  aiMetadata: { description: 'Lists the PromptMate projects available to the authenticated account. Use it to discover which projects exist for organizing apps. Takes no input; read-only and safe to repeat.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.promptmate.io/v1/projects',
      headers: {
        'x-api-key': auth.secret_text,
      },
    });

    return response.body;
  },
});
