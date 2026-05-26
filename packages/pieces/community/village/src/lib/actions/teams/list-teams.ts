import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const listTeams = createAction({
  auth: villageAuth,
  name: 'list_teams',
  displayName: 'List Teams',
  description:
    'Get all teams you are a member of. Each team includes id, name, logo, invite_link, and an is_admin flag indicating your admin status.',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/teams`,
      headers: { Authorization: `Bearer ${context.auth}` },
    });
    return response.body;
  },
});
