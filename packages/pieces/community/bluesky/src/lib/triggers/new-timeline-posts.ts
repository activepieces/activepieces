import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

export const newTimelinePosts = createTrigger({
  auth: blueskyAuth,
  name: 'new-timeline-posts',
  displayName: 'New Timeline Posts',
  description: 'Fires when new posts appear in your "Following" feed (chronological).',
  props: {},
  sampleData: {
    uri: 'at://did:example/app.bsky.feed.post/456',
    text: 'Timeline post example',
    createdAt: '2023-01-01T00:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastSeenTimelinePostUri', '');
  },
  async onDisable(context) {
    await context.store.delete('lastSeenTimelinePostUri');
  },
  async run(context) {
    const { serviceUrl, identifier, password } = context.auth;
    const agent = new BskyAgent({ service: serviceUrl });
    await agent.login({ identifier, password });
    const timeline = await agent.getTimeline({ limit: 20 });
    const posts = timeline.data.feed || [];
    const lastSeenUri = await context.store.get<string>('lastSeenTimelinePostUri');
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
      await context.store.put('lastSeenTimelinePostUri', posts[0].post.uri);
    }
    return newPosts.reverse(); // oldest first
  },
}); 