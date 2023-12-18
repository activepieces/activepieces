import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { activePieceAuth, config } from '../../index';

export const createProject = createAction({
  name: 'create_project',
  auth: activePieceAuth,
  displayName: 'New Project',
  description: 'Create a new project',
  props: {
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: undefined,
      required: true,
    })
  },
  async run({ propsValue, auth }) {
    return await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${config.baseApiUrl}/projects`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth
      },
      body: {
        displayName: propsValue['display_name']
      }
    });
  },
});

