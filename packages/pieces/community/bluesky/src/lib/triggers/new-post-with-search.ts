import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

function isNonEmptyString(str: string | undefined): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

export const newPostWithSearch = createTrigger({
  auth: blueskyAuth,
  name: 'new-post-with-search',
  displayName: 'New Post (with Search Options)',
  description: 'Fires when a new post matches given search criteria (mentions, tags, keywords).',
  props: {
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Comma-separated keywords to search for.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated hashtags to search for.',
      required: false,
    }),
    mentions: Property.ShortText({
      displayName: 'Mentions',
      description: 'Comma-separated handles or DIDs to search for mentions.',
      required: false,
    }),
  },
  sampleData: {
    uri: 'at://did:example/app.bsky.feed.post/789',
    text: 'Post with #tag and @mention',
    createdAt: '2023-01-01T00:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastSeenSearchPostUri', '');
  },
  async onDisable(context) {
    await context.store.delete('lastSeenSearchPostUri');
  },
  async run(context) {
    const { serviceUrl, identifier, password } = context.auth;
    const { keywords, tags, mentions } = context.propsValue;
    const agent = new BskyAgent({ service: serviceUrl });
    await agent.login({ identifier, password });
    let query = '';
    if (isNonEmptyString(keywords)) {
      query += keywords!.split(',').map((k: string) => k.trim()).filter(Boolean).join(' ');
    }
    if (isNonEmptyString(tags)) {
      query += ' ' + tags!.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean).map(t => `#${t}`).join(' ');
    }
    if (isNonEmptyString(mentions)) {
      query += ' ' + mentions!.split(',').map((m: string) => m.trim()).filter(Boolean).map(m => m.startsWith('@') ? m : `@${m}`).join(' ');
    }
    query = query.trim();
    if (!query) return [];
    const searchRes = await agent.app.bsky.feed.searchPosts({ q: query, limit: 20 });
    const posts = searchRes.data.posts || [];
    const lastSeenUri = await context.store.get<string>('lastSeenSearchPostUri');
    let newPosts = [];
    for (const post of posts) {
      if (post.uri === lastSeenUri) break;
      newPosts.push({
        uri: post.uri,
        text: post.record?.['text'],
        createdAt: post.record?.['createdAt'],
      });
    }
    if (posts[0]?.uri) {
      await context.store.put('lastSeenSearchPostUri', posts[0].uri);
    }
    return newPosts.reverse(); // oldest first
  },
}); 