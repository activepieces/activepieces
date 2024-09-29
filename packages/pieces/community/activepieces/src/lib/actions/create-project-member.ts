import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { activePieceAuth, config } from '../../index';

export const createProjectMember = createAction({
  name: 'create_project_member',
  auth: activePieceAuth,
  displayName: 'Create Project Member',
  description: 'add or invite a new project member',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project Id',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: undefined,
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: undefined,
      required: true,
      options: {
        options: [
          {
            label: 'Admin',
            value: 'ADMIN',
          },
          {
            label: 'Editor',
            value: 'EDITOR',
          },
          {
            label: 'Viewer',
            value: 'VIEWER',
          },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: undefined,
      required: false,
      options: {
        options: [
          {
            label: 'Active',
            value: 'ACTIVE',
          },
          {
            label: 'Pending',
            value: 'PENDING',
          },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const response = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${config.baseApiUrl}/project-members`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      body: {
        email: propsValue['email'],
        projectId: propsValue['project_id'],
        role: propsValue['role'],
        status: propsValue['status'],
      },
    });

    return response.body;
  },
});
