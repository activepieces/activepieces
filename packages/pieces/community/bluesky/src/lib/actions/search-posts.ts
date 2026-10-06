import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { postListOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyMappers } from '../common/mappers';
import { blueskyRefs } from '../common/refs';
import { blueskyCompose } from '../common/compose';

export const searchPosts = createAction({
  auth: blueskyAuth,
  name: 'search_posts',
  classification: 'SEARCH',
  displayName: 'Search Posts',
  description: 'Search public Bluesky posts',
  audience: 'both',
  outputSchema: postListOutputSchema,
  aiMetadata: {
    description:
      'Searches public Bluesky posts by query, with optional author, mention, language, domain, link, tag and date-range filters, sorted latest or top and paginated with a cursor. Use Get User\'s Posts to read one account\'s feed instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Words, "exact phrases", #hashtags or from:handle. Use * to match everything when you only filter.',
      required: true,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      defaultValue: 'latest',
      options: { options: [{ label: 'Latest', value: 'latest' }, { label: 'Top', value: 'top' }] },
    }),
    author: Property.ShortText({ displayName: 'Author', description: 'Only posts by this handle or DID.', required: false }),
    mentions: Property.ShortText({ displayName: 'Mentions', description: 'Only posts that mention this handle or DID.', required: false }),
    lang: Property.ShortText({ displayName: 'Language', description: 'Only posts in this language, for example en or ja.', required: false }),
    domain: Property.ShortText({ displayName: 'Link Domain', description: 'Only posts linking to this domain, for example activepieces.com.', required: false }),
    url: Property.ShortText({ displayName: 'Link URL', description: 'Only posts linking to this exact URL.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Only posts with all of these hashtags (without #).', required: false }),
    since: Property.DateTime({ displayName: 'Since', description: 'Only posts created at or after this time.', required: false }),
    until: Property.DateTime({ displayName: 'Until', description: 'Only posts created before this time.', required: false }),
    limit: blueskyProps.limitProperty(),
    cursor: blueskyProps.cursorProperty(),
  },
  async run({ auth, propsValue }) {
    const q = propsValue.query.trim();
    if (q === '') {
      throw new Error('Search Query is empty. Use * to match everything.');
    }
    const limit = blueskyProps.parseLimit(propsValue.limit);
    const cursor = blueskyProps.parseCursor(propsValue.cursor);
    const tag = blueskyCompose.stringList(propsValue.tags).map((value) => value.replace(/^#/, ''));
    const since = isoOrUndefined({ value: propsValue.since, label: 'Since' });
    const until = isoOrUndefined({ value: propsValue.until, label: 'Until' });
    const author = propsValue.author?.trim() ? blueskyRefs.parseActorInput(propsValue.author) : undefined;
    const mentions = propsValue.mentions?.trim() ? blueskyRefs.parseActorInput(propsValue.mentions) : undefined;
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'search posts',
      fn: async (agent) => {
        const response = await agent.app.bsky.feed.searchPosts({
          q,
          sort: propsValue.sort ?? 'latest',
          limit,
          cursor,
          ...(author ? { author } : {}),
          ...(mentions ? { mentions } : {}),
          ...(propsValue.lang?.trim() ? { lang: propsValue.lang.trim() } : {}),
          ...(propsValue.domain?.trim() ? { domain: propsValue.domain.trim() } : {}),
          ...(propsValue.url?.trim() ? { url: propsValue.url.trim() } : {}),
          ...(tag.length > 0 ? { tag } : {}),
          ...(since ? { since } : {}),
          ...(until ? { until } : {}),
        });
        return blueskyMappers.pageOf({
          items: response.data.posts.map((post) => ({ ...blueskyMappers.postBase(post), text: blueskyMappers.recordText(post.record) })),
          cursor: response.data.cursor,
        });
      },
    });
  },
});

function isoOrUndefined({ value, label }: { value: string | undefined; label: string }): string | undefined {
  if (!value) {
    return undefined;
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    throw new Error(`${label} is not a valid date.`);
  }
  return new Date(time).toISOString();
}
