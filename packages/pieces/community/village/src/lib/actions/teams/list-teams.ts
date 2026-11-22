import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listTeams = createAction({
  auth: villageAuth,
  name: 'list_teams',
  classification: 'SEARCH',
  displayName: 'List Teams',
  description:
    'Get all teams you are a member of. Each team includes id, name, logo, invite_link, and an is_admin flag indicating your admin status.',
  audience: 'both',
  aiMetadata: {
    description:
      'List every team the authenticated user belongs to, including each team ID and the admin-status flag. Read-only and idempotent. Use to discover team IDs before joining, leaving, or updating a team.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listTeams,
  props: {},
  async run(context) {
    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/teams`,
    });
    return response;
  },
});
