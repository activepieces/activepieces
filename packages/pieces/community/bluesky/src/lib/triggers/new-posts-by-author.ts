import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

export const newPostsByAuthor = createTrigger({
  auth: blueskyAuth,
  name: 'new-posts-by-author',
  displayName: 'New Posts by Author',
  description: 'Fires when a selected author creates a new post.',
  props: {
    author: Property.ShortText({
      displayName: 'Author DID or Handle',
      description: 'The DID or handle of the author to monitor.',
      required: true,
    }),
  },
  sampleData: {
    uri: 'at://did:example/app.bsky.feed.post/123',
    text: 'Example post',
    createdAt: '2023-01-01T00:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastSeenPostUri', '');
  },
  async onDisable(context) {
    await context.store.delete('lastSeenPostUri');
  },
  async run(context) {
    const { serviceUrl, identifier, password } = context.auth;
    const { author } = context.propsValue;
    const agent = new BskyAgent({ service: serviceUrl });
    await agent.login({ identifier, password });
    const feed = await agent.getAuthorFeed({ actor: author, limit: 20 });
    const posts = feed.data.feed || [];
    const lastSeenUri = await context.store.get<string>('lastSeenPostUri');
    let newPosts = [];
    for (const post of posts) {
      if (post.post && post.post.uri === lastSeenUri) break;
      if (post.post) newPosts.push({
        uri: post.post.uri,
        text: post.post.record?.['text'],
        createdAt: post.post.record?.['createdAt'],
      });
    }
    if (posts[0]?.post?.uri) {
      await context.store.put('lastSeenPostUri', posts[0].post.uri);
    }
    return newPosts.reverse(); // oldest first
  },
}); 