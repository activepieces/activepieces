import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { feedListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const getAuthorFeed = createAction({
  auth: blueskyAuth,
  name: 'get_author_feed',
  classification: 'SEARCH',
  displayName: "Get User's Posts",
  description: 'List the latest posts and reposts of one account',
  audience: 'both',
  outputSchema: feedListOutputSchema,
  aiMetadata: {
    description:
      'Lists one Bluesky account\'s own feed, newest first (its posts and reposts), filtered to posts without replies (default), with replies, only media, only video, or author threads, with cursor pagination. Use Search Posts to search across all accounts. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    actor: blueskyProps.optionalActorProperty({ description: 'Handle (alice.bsky.social), DID or profile link. Leave empty for your own posts.' }),
    filter: Property.StaticDropdown({
      displayName: 'Include',
      required: false,
      defaultValue: 'posts_no_replies',
      options: {
        options: [
          { label: 'Posts and reposts, no replies', value: 'posts_no_replies' },
          { label: 'Posts, reposts and replies', value: 'posts_with_replies' },
          { label: 'Only posts with media', value: 'posts_with_media' },
          { label: 'Only posts with video', value: 'posts_with_video' },
          { label: 'Posts and the author\'s own threads', value: 'posts_and_author_threads' },
        ],
      },
    }),
    includePins: Property.Checkbox({ displayName: 'Include Pinned Post', description: 'Put the pinned post first.', required: false, defaultValue: false }),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    if (propsValue.actor && propsValue.actor.trim() !== '') {
      blueskyRefs.parseActorInput(propsValue.actor);
    }
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: "get the user's posts",
      fn: async (agent) => {
        const actor = propsValue.actor && propsValue.actor.trim() !== '' ? blueskyRefs.parseActorInput(propsValue.actor) : blueskyClient.sessionDid(agent);
        const response = await agent.getAuthorFeed({
          actor,
          limit,
          cursor,
          filter: propsValue.filter ?? 'posts_no_replies',
          includePins: propsValue.includePins === true,
        });
        return blueskyMappers.pageOf({ items: response.data.feed.map(blueskyMappers.feedItem), cursor: response.data.cursor });
      },
    });
  },
});
