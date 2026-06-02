import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const joinTeam = createAction({
  auth: villageAuth,
  name: 'join_team',
  displayName: 'Join Team',
  description:
    'Join a team using an invite link. Provide the invite link code (the part after /join/ in the URL).',
  props: {
    team_invite_link: Property.ShortText({
      displayName: 'Team Invite Link',
      description: 'The invite link code shared by a team admin (e.g. the part after /join/ in the invite URL)',
      required: true,
    }),
  },
  async run(context) {
    const { team_invite_link } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/teams/join`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: { team_invite_link },
    });
    return response.body;
  },
});
