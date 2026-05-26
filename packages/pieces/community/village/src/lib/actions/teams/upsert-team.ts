import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const upsertTeam = createAction({
  auth: villageAuth,
  name: 'upsert_team',
  displayName: 'Create or Update Team',
  description:
    'Create a new team or update an existing one. To create: provide a name (id is auto-generated). To update: provide the team_id (requires admin permissions).',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Team name (max 100 characters)',
      required: true,
    }),
    team_id: Property.ShortText({
      displayName: 'Team ID',
      description: 'Existing team ID to update. Omit to create a new team.',
      required: false,
    }),
    logo: Property.ShortText({
      displayName: 'Logo',
      description: 'URL to the team logo image',
      required: false,
    }),
  },
  async run(context) {
    const { name, team_id, logo } = context.propsValue;

    const body: Record<string, unknown> = { name };
    if (team_id !== undefined) body['team_id'] = team_id;
    if (logo !== undefined) body['logo'] = logo;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/teams`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body,
    });
    return response.body;
  },
});
