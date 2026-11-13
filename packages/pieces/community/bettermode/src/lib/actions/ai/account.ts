import { createAction } from '@activepieces/pieces-framework';
import { bettermodeAuth } from '../../auth';
import { bindTokenStore, bettermodeQuery } from '../../common/client';
import { MEMBER_FIELDS } from '../../common/fields';
import { bettermodeMap } from '../../common/mappers';
import { bettermodeSchemas } from '../../common/schemas';

export const getCurrentMemberAction = createAction({
  auth: bettermodeAuth,
  name: 'get_current_member',
  classification: 'READ',
  displayName: 'Get Current Member',
  description: 'Get the member the connection is logged in as.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Bettermode member this connection acts as (ID, name, email, role). Use first to learn your own member ID or check whether the connection has an admin role. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: bettermodeSchemas.member,
  async run({ auth, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query GetCurrentMember {
  authMember {
${MEMBER_FIELDS}
  }
}`,
    });
    return bettermodeMap.member(data['authMember']);
  },
});

export const getNetworkAction = createAction({
  auth: bettermodeAuth,
  name: 'get_network',
  classification: 'READ',
  displayName: 'Get Community',
  description: 'Get the community (network) details.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected Bettermode community: ID, name, domain, plan and member count. Use to confirm which community you are working in or check the plan before plan-gated actions (events, chat, badges). Read-only, safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: bettermodeSchemas.network,
  async run({ auth, store }) {
    bindTokenStore({ credentials: auth.props, store });
    const data = await bettermodeQuery({
      auth: auth.props,
      query: `query GetNetwork {
  network {
    id
    name
    domain
    description
    planName
    membersCount
    createdAt
  }
}`,
    });
    return bettermodeMap.network(data['network']);
  },
});
