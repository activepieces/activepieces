import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonProps } from '../common/client';
import { tagPageOutputSchema } from '../output-schemas';

export const listFollowedTags = createAction({
  auth: mastodonAuth,
  name: 'list_followed_tags',
  classification: 'SEARCH',
  displayName: 'List Followed Hashtags',
  description: 'List the hashtags you follow.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one page of hashtags followed by the connected account. Cursors come from Link headers, which servers before 4.1 do not send (then everything is returned in one page with null cursors). Requires Mastodon 4.0 or later. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: tagPageOutputSchema,
  props: {
    limit: mastodonProps.limit({ noun: 'hashtags', defaultLimit: 100, maxLimit: 200 }),
    max_id: mastodonProps.maxId(),
    since_id: mastodonProps.sinceId(),
    min_id: mastodonProps.minId(),
  },
  async run(context) {
    const { limit, max_id, since_id, min_id } = context.propsValue;
    const { items, ...cursors } = await mastodonClient.requestPage<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v1/followed_tags',
      operation: 'List Followed Hashtags',
      scope: 'read:follows',
      minVersion: '4.0.0',
      query: { limit, max_id, since_id, min_id },
    });
    return { tags: items, ...cursors };
  },
});
