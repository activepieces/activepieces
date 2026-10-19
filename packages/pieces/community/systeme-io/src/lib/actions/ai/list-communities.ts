import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../../common/auth';
import { communityRow } from '../../common/mappers';
import { aiListCommunitiesOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeListCommunities = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_communities',
  classification: 'SEARCH',
  displayName: 'List Communities',
  description: 'List communities, optionally filtered by name',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Systeme.io communities (id, name, path, domain). Use to find the community_id needed by add_contact_to_community and remove_contact_from_community. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Optional text to search community names for.',
      required: false,
    }),
    max_results: aiCommon.maxResultsProp,
    starting_after: aiCommon.startingAfterProp,
  },
  outputSchema: aiListCommunitiesOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const result = await aiCommon.list({
      apiKey: context.auth.secret_text,
      url: '/community/communities',
      query: { query: p.query?.trim() || undefined },
      maxResults: p.max_results,
      startingAfter: p.starting_after,
      map: communityRow,
    });
    return { communities: result.items, count: result.count, has_more: result.has_more, next_cursor: result.next_cursor };
  },
});
