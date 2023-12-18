import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { activePieceAuth, config } from '../../index';

export const listProjectMember = createAction({
  name: 'list_project_member',
  auth: activePieceAuth,
  displayName: 'List Project Member',
  description: 'List all project Member',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project Id',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    return await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${config.baseApiUrl}/projects-members`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth
      },
      queryParams: {
        projectId: propsValue['project_id'],
      }
    });
  },
});

