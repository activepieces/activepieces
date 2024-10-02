import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { activePieceAuth } from '../../index';

export const deleteProjectMember = createAction({
  name: 'delete_project_member',
  auth: activePieceAuth,
  displayName: 'Delete Project Member',
  description: 'Delete a project Member',
  props: {
    id: Property.ShortText({
      displayName: 'Project member Id',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await httpClient.sendRequest<string[]>({
      method: HttpMethod.DELETE,
      url: `${auth.baseApiUrl}/project-members/${propsValue['id']}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.apiKey,
      },
    });

    return response.body;
  },
});
