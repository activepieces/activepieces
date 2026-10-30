import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const listTagsAction = createAction({
  auth: discourseAuth,
  name: 'list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'Lists the tags of a Discourse forum with topic counts.',
  audience: 'ai',
  aiMetadata: {
    description: 'List all Discourse tags the API user can see, with how many topics use each. Fails if tagging is disabled on the forum. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: discourseSchemas.tagList,
  async run({ auth }) {
    const body = discourseMap.rec(await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: '/tags.json' }));
    const items = discourseMap.list(body['tags']).map((raw) => discourseMap.tag({ raw }));
    return { items, count: items.length, has_more: false };
  },
});
