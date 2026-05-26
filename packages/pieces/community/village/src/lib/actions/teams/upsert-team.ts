import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const upsertTeam = createAction({
  auth: villageAuth,
  name: 'upsert_team',
  displayName: 'Create or Update Team',
  description:
    'Create or update a team. The team ID is derived from the team name; repeated calls with the same name update the same team (requires admin permissions on update).',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Team name (max 100 characters)',
      required: true,
    }),
    logo: Property.ShortText({
      displayName: 'Logo',
      description: 'URL to the team logo image',
      required: false,
    }),
  },
  async run(context) {
    const { name, logo } = context.propsValue;

    const body: Record<string, unknown> = { name };
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
