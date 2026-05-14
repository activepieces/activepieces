// Action: Add User to Project Team
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { projectDropdown, userDropdown, flattenObject } from '../common';

export const addUserToTeamAction = createAction({
  auth: youtrackAuth,
  name: 'add_user_to_team',
  displayName: 'Add User to Project Team',
  description: 'Adds a user as a direct member of a project team, giving them access to the project.',
  props: { project: projectDropdown, user: userDropdown },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/admin/projects/' + context.propsValue.project +
      '/team/ownUsers?fields=id,login,name';
    const r = await fetch(url, {
      method: HttpMethod.POST,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: context.propsValue.user }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error('Failed to add user to team: ' + JSON.stringify(data));
    return flattenObject(data);
  },
  sampleData: { id: '1-7', login: 'Mad_Max', name: 'Mad Max' },
});
