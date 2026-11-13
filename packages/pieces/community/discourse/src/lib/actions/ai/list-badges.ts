import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const listBadgesAction = createAction({
  auth: discourseAuth,
  name: 'list_badges',
  classification: 'SEARCH',
  displayName: 'List Badges',
  description: 'Lists the badges available on a Discourse forum.',
  audience: 'ai',
  aiMetadata: {
    description: 'List all enabled Discourse badges with numeric IDs, descriptions and grant counts. Use it to find the Badge ID for Grant Badge. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: discourseSchemas.badgeList,
  async run({ auth }) {
    const body = discourseMap.rec(await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: '/badges.json' }));
    const items = discourseMap.list(body['badges']).map((raw) => discourseMap.badge({ raw }));
    return { items, count: items.length, has_more: false };
  },
});
