import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

export const newFollower = createTrigger({
  auth: blueskyAuth,
  name: 'new-follower',
  displayName: 'New Follower on Account',
  description: 'Fires when someone new follows your account.',
  props: {},
  sampleData: {
    did: 'did:example:123',
    handle: 'follower.handle',
    displayName: 'Follower Name',
    followedAt: '2023-01-01T00:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastSeenFollowers', []);
  },
  async onDisable(context) {
    await context.store.delete('lastSeenFollowers');
  },
  async run(context) {
    const { serviceUrl, identifier, password } = context.auth;
    const agent = new BskyAgent({ service: serviceUrl });
    await agent.login({ identifier, password });
    const profile = await agent.getProfile({ actor: identifier });
    const myDid = profile.data.did;
    const followersRes = await agent.getFollowers({ actor: myDid, limit: 50 });
    const followers = followersRes.data.followers || [];
    const lastSeen = (await context.store.get<string[]>('lastSeenFollowers')) || [];
    const newFollowers = followers.filter(f => !lastSeen.includes(f.did)).map(f => ({
      did: f.did,
      handle: f.handle,
      displayName: f.displayName,
      followedAt: f.createdAt,
    }));
    const currentDids = followers.map(f => f.did);
    await context.store.put('lastSeenFollowers', currentDids);
    return newFollowers.reverse(); // oldest first
  },
}); 