import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const discoverTeamsByDomain = createAction({
  auth: villageAuth,
  name: 'discover_teams_by_domain',
  classification: 'SEARCH',
  displayName: 'Discover Teams by Email Domain',
  description: "List Village teams that have claimed your email address's domain and that you are not in yet. Free.",
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Village teams that claimed the caller\'s email domain (excluding teams the caller already belongs to), with member counts and network reach. Empty for public email providers. Free, read-only. Joining needs an invite link (Join Team).',
    idempotent: true,
  },
  outputSchema: villageSchemas.discoverTeamsByDomain,
  props: {},
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/teams/discover-by-domain',
    });
  },
});
