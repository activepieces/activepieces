import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { projectDropdown, userDropdown, flattenObject, youtrackApiCall } from '../common';

export const addUserToTeamAction = createAction({
  auth: youtrackAuth,
  name: 'add_user_to_team',
  displayName: 'Add User to Project Team',
  description: 'Adds a user as a direct member of a project team, giving them access to the project.',
  props: { project: projectDropdown, user: userDropdown },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const response = await youtrackApiCall<Record<string, unknown>>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/admin/projects/' + context.propsValue.project + '/team/ownUsers',
      queryParams: { fields: 'id,login,name' },
      body: { id: context.propsValue.user },
    });
    return flattenObject(response.body);
  },
});
