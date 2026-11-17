import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const upsertTeam = createAction({
  auth: villageAuth,
  name: 'upsert_team',
  classification: 'WRITE',
  displayName: 'Create or Update Team',
  description:
    'Create or update a team. The team ID is derived from the team name; repeated calls with the same name update the same team (requires admin permissions on update).',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a team, or update an existing one when a team with the same name already exists since the team ID is derived from the name. Idempotent by stable name: repeating the same name and fields converges to one team rather than creating duplicates (updating requires admin permission on that team).',
    idempotent: true,
  },
  outputSchema: villageSchemas.upsertTeamOrGroup,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/teams`,
      body,
    });
    return response;
  },
});
