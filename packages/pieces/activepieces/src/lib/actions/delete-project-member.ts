import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { config } from '../../index';

export const deleteProjectMember = createAction({
  name: 'delete_project_member',
  auth: config.auth,
  displayName: 'Delete Project Member',
  description: 'Delete a project Member',
  props: {
    id: Property.ShortText({
      displayName: 'Project member Id',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    return await httpClient.sendRequest<string[]>({
      method: HttpMethod.DELETE,
      url: `${config.baseApiUrl}/projects-members/${propsValue['id']}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth
      },
    });
  },
});

