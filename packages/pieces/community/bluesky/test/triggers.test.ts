import { afterEach, describe, expect, it, vi } from 'vitest';
import { newTimelinePosts } from '../src/lib/triggers/new-timeline-posts';
import { newFollowerOnAccount } from '../src/lib/triggers/new-follower-on-account';
import { newPostsByAuthor } from '../src/lib/triggers/new-posts-by-author';
import { newPost } from '../src/lib/triggers/new-post';
import { newMention } from '../src/lib/triggers/new-mention';
import { newNotification } from '../src/lib/triggers/new-notification';
import { bluesky } from '../src/index';
import { CID, ME_DID, OTHER_DID, OTHER_HANDLE, installFakeBluesky, json, postView, profileView, triggerContext, xrpcError } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const THIRD_DID = 'did:plc:cccccccccccccccccccccccc';
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function repostReason({ did, indexedAt }: { did: string; indexedAt: string }) {
  return { $type: 'app.bsky.feed.defs#reasonRepost', by: { did, handle: 'reposter.bsky.social' }, indexedAt };
}

describe('New Timeline Posts', () => {
  it('seeds on enable, then fires once per new item including a repost of an old post', async () => {
    let feed: unknown[] = [{ post: postView({ rkey: '3a', indexedAt: minutesAgo(10) }) }];
    installFakeBluesky({ routes: { 'app.bsky.feed.getTimeline': () => json({ feed }) } });
    const store = new Map<string, string>();
    const context = triggerContext({ propsValue: {}, store });
    await newTimelinePosts.onEnable(context);
    feed = [
      { post: postView({ rkey: '3old', indexedAt: '2026-01-01T00:00:00.000Z' }), reason: repostReason({ did: THIRD_DID, indexedAt: minutesAgo(5) }) },
      ...feed,
    ];
    const first = await newTimelinePosts.run(context);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ uri: `at://${OTHER_DID}/app.bsky.feed.post/3old`, feedContext: { isRepost: true } });
    expect(await newTimelinePosts.run(context)).toEqual([]);
  });

  it('throws on bad credentials instead of returning no posts', async () => {
    installFakeBluesky({
      routes: { 'com.atproto.server.createSession': () => xrpcError({ status: 401, error: 'AuthenticationRequired', message: 'Invalid identifier or password' }) },
    });
    const context = triggerContext({ propsValue: {}, store: new Map() });
    await expect(newTimelinePosts.run(context)).rejects.toThrow(/rejected the credentials/);
  });

  it('keeps its state on republish so nothing between polls is lost', async () => {
    let feed: unknown[] = [{ post: postView({ rkey: '3a' }) }];
    installFakeBluesky({ routes: { 'app.bsky.feed.getTimeline': () => json({ feed }) } });
    const store = new Map<string, string>();
    await newTimelinePosts.onEnable(triggerContext({ propsValue: {}, store }));
    feed = [{ post: postView({ rkey: '3b', indexedAt: minutesAgo(9) }) }, ...feed];
    await newTimelinePosts.onEnable(triggerContext({ propsValue: {}, store, isRepublish: true }));
    expect(await newTimelinePosts.run(triggerContext({ propsValue: {}, store }))).toHaveLength(1);
  });
});

describe('New Follower on Account', () => {
  it('fires for a follower whose profile is old and never for the same follower twice', async () => {
    let followers = [profileView({ did: THIRD_DID, handle: 'first.bsky.social' })];
    installFakeBluesky({ routes: { 'app.bsky.graph.getFollowers': () => json({ subject: profileView({ did: ME_DID, handle: 'me.bsky.social' }), followers }) } });
    const store = new Map<string, string>();
    const context = triggerContext({ propsValue: {}, store });
    await newFollowerOnAccount.onEnable(context);
    followers = [profileView(), ...followers];
    const events = await newFollowerOnAccount.run(context);
    expect(events).toEqual([expect.objectContaining({ did: OTHER_DID, handle: OTHER_HANDLE, url: `https://bsky.app/profile/${OTHER_HANDLE}` })]);
    expect(await newFollowerOnAccount.run(context)).toEqual([]);
  });
});

describe('New Posts by Author', () => {
  it('matches by DID and includes the author\'s reposts when asked', async () => {
    let feed: unknown[] = [];
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.identity.resolveHandle': () => json({ did: OTHER_DID }),
        'app.bsky.feed.getAuthorFeed': () => json({ feed }),
      },
    });
    const store = new Map<string, string>();
    const propsValue = { authorSelection: 'manual', authorHandle: '@Other.bsky.social', includeReposts: true, includeReplies: false };
    const context = triggerContext({ propsValue, store });
    await newPostsByAuthor.onEnable(context);
    feed = [
      { post: postView({ rkey: '3theirs', did: THIRD_DID, handle: 'third.bsky.social', indexedAt: '2026-01-01T00:00:00.000Z' }), reason: repostReason({ did: OTHER_DID, indexedAt: minutesAgo(5) }) },
      { post: postView({ rkey: '3own', indexedAt: minutesAgo(6) }) },
      {
        post: postView({
          rkey: '3reply',
          indexedAt: minutesAgo(7),
          extra: { record: { $type: 'app.bsky.feed.post', text: 'r', createdAt: minutesAgo(7), reply: { root: { uri: `at://${THIRD_DID}/app.bsky.feed.post/3x`, cid: CID }, parent: { uri: `at://${THIRD_DID}/app.bsky.feed.post/3x`, cid: CID } } } },
        }),
      },
    ];
    const events = await newPostsByAuthor.run(context);
    expect(events.map((e) => (typeof e === 'object' && e !== null && 'uri' in e ? e.uri : null))).toEqual([
      `at://${THIRD_DID}/app.bsky.feed.post/3theirs`,
      `at://${OTHER_DID}/app.bsky.feed.post/3own`,
    ]);
    expect(events[0]).toMatchObject({ postContext: { isRepost: true, authorHandle: 'Other.bsky.social' } });
    expect(fake.callsTo('app.bsky.feed.getAuthorFeed')[0].query.get('actor')).toBe(OTHER_DID);
  });

  it('refuses to enable without an author', async () => {
    installFakeBluesky({ routes: {} });
    const context = triggerContext({ propsValue: { authorSelection: 'following' }, store: new Map() });
    await expect(newPostsByAuthor.onEnable(context)).rejects.toThrow(/Select an author/);
  });
});

describe('New Post (search)', () => {
  it('treats an unticked media filter as no filter', async () => {
    const image = { $type: 'app.bsky.embed.images#view', images: [] };
    let posts: unknown[] = [];
    installFakeBluesky({ routes: { 'app.bsky.feed.searchPosts': () => json({ posts }) } });
    const store = new Map<string, string>();
    const context = triggerContext({ propsValue: { searchQuery: 'AP-TEST', includeImages: false, includeVideos: false }, store });
    await newPost.onEnable(context);
    posts = [postView({ rkey: '3img', indexedAt: minutesAgo(10), extra: { embed: image } }), postView({ rkey: '3txt', indexedAt: minutesAgo(11) })];
    expect(await newPost.run(context)).toHaveLength(2);
  });
});

describe('notification triggers', () => {
  const notification = ({ rkey, reason, indexedAt }: { rkey: string; reason: string; indexedAt: string }) => ({
    uri: `at://${OTHER_DID}/app.bsky.feed.post/${rkey}`,
    cid: CID,
    author: { did: OTHER_DID, handle: OTHER_HANDLE },
    reason,
    record: { $type: 'app.bsky.feed.post', text: `@me ${rkey}`, createdAt: indexedAt },
    isRead: false,
    indexedAt,
  });

  it('New Mention or Reply hydrates the post and never marks anything seen', async () => {
    let notifications: unknown[] = [];
    const fake = installFakeBluesky({
      routes: {
        'app.bsky.notification.listNotifications': () => json({ notifications }),
        'app.bsky.feed.getPosts': () => json({ posts: [postView({ rkey: '3m', text: '@me 3m' })] }),
      },
    });
    const store = new Map<string, string>();
    const context = triggerContext({ propsValue: {}, store });
    await newMention.onEnable(context);
    notifications = [notification({ rkey: '3m', reason: 'mention', indexedAt: minutesAgo(10) })];
    const events = await newMention.run(context);
    expect(events).toEqual([expect.objectContaining({ notificationReason: 'mention', text: '@me 3m', url: `https://bsky.app/profile/${OTHER_HANDLE}/post/3m` })]);
    expect(fake.callsTo('app.bsky.notification.listNotifications')[0].query.getAll('reasons')).toEqual(['mention', 'reply', 'quote']);
    expect(fake.callsTo('app.bsky.notification.updateSeen')).toHaveLength(0);
  });

  it('New Mention or Reply still fires from the notification when the post was deleted', async () => {
    let notifications: unknown[] = [];
    installFakeBluesky({
      routes: {
        'app.bsky.notification.listNotifications': () => json({ notifications }),
        'app.bsky.feed.getPosts': () => json({ posts: [postView({ rkey: '3kept', text: '@me 3kept' })] }),
      },
    });
    const store = new Map<string, string>();
    const context = triggerContext({ propsValue: {}, store });
    await newMention.onEnable(context);
    notifications = [
      notification({ rkey: '3gone', reason: 'reply', indexedAt: minutesAgo(9) }),
      notification({ rkey: '3kept', reason: 'mention', indexedAt: minutesAgo(10) }),
    ];
    const events = await newMention.run(context);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      uri: `at://${OTHER_DID}/app.bsky.feed.post/3gone`,
      url: `https://bsky.app/profile/${OTHER_HANDLE}/post/3gone`,
      text: '@me 3gone',
      notificationReason: 'reply',
      postAvailable: false,
      likeCount: null,
      replyCount: null,
    });
    expect(events[1]).toMatchObject({ text: '@me 3kept', postAvailable: true, likeCount: 1 });
    expect(await newMention.run(context)).toEqual([]);
  });

  it('New Notification passes the chosen types', async () => {
    const fake = installFakeBluesky({ routes: { 'app.bsky.notification.listNotifications': () => json({ notifications: [notification({ rkey: '3q', reason: 'quote', indexedAt: minutesAgo(10) })] }) } });
    const events = await newNotification.test(triggerContext({ propsValue: { reasons: ['quote', 'like'] }, store: new Map() }));
    expect(events).toHaveLength(1);
    expect(fake.callsTo('app.bsky.notification.listNotifications')[0].query.getAll('reasons')).toEqual(['quote', 'like']);
  });
});

describe('piece metadata', () => {
  it('tags every action and trigger for agents', () => {
    const metadata = bluesky.metadata();
    const actions = Object.values(metadata.actions);
    for (const action of actions) {
      if (action.name === 'custom_api_call') {
        continue;
      }
      expect(action.classification, action.name).toBeDefined();
      expect(action.audience, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema, action.name).toBeDefined();
    }
    for (const trigger of Object.values(metadata.triggers)) {
      expect(trigger.classification, trigger.name).toBe('READ');
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
    expect(actions.filter((a) => a.audience === 'ai').map((a) => a.name).sort()).toEqual([
      'bluesky_create_post',
      'bluesky_get_posts',
      'bluesky_get_unread_count',
      'bluesky_like_post',
      'bluesky_repost_post',
      'bluesky_resolve_handle',
    ]);
  });
});
