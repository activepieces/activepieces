import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { config } from '../../index';

export const listProject = createAction({
  name: 'list_project',
  auth: config.auth,
  displayName: 'List Projects',
  description: 'List all projects',
  props: {},
  async run({ auth }) {
    return await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${config.baseApiUrl}/projects`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth
      },
    });
  },
});

