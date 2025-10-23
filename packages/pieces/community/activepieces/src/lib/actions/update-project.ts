import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { activePieceAuth } from '../../index';

export const updateProject = createAction({
  name: 'update_project',
  auth: activePieceAuth,
  displayName: 'Update Project',
  description: 'Update a project',
  props: {
    id: Property.ShortText({
      displayName: 'Id',
      description: 'Id of the project',
      required: true,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: undefined,
      required: true,
    }),
    notify_status: Property.StaticDropdown({
      displayName: 'Notify Status',
      description: undefined,
      required: true,
      options: {
        options: [
          {
            label: 'Always notify',
            value: 'ALWAYS',
          },
          {
            label: 'Never notify',
            value: 'NEVER',
          },
        ],
      },
    }),
    tasks: Property.Number({
      displayName: 'Tasks',
      description: undefined,
      required: true,
    }),
    team_members: Property.Number({
      displayName: 'Team Members',
      description: undefined,
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${auth.baseApiUrl}/projects/${propsValue['id']}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.apiKey,
      },
      body: {
        displayName: propsValue['display_name'],
        plan: {
          tasks: propsValue['tasks'],
          teamMembers: propsValue['team_members'],
        },
      },
    });

    return response.body;
  },
});
