import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPost } from '../src/lib/actions/create-post';
import { deletePost } from '../src/lib/actions/delete-post';
import { blueskyLikePost } from '../src/lib/actions/bluesky-like-post';
import { unlikePost } from '../src/lib/actions/unlike-post';
import { followUser } from '../src/lib/actions/follow-user';
import { searchPosts } from '../src/lib/actions/search-posts';
import { getTimeline } from '../src/lib/actions/get-timeline';
import { findThread } from '../src/lib/actions/find-thread';
import { updateProfile } from '../src/lib/actions/update-profile';
import { removeUserFromList } from '../src/lib/actions/remove-user-from-list';
import { deleteList } from '../src/lib/actions/delete-list';
import { blueskyCreatePost } from '../src/lib/actions/bluesky-create-post';
import { bluesky } from '../src/index';
import { blueskyClient } from '../src/lib/common/client';
import {
  CID,
  ME_DID,
  ME_HANDLE,
  OTHER_DID,
  OTHER_HANDLE,
  installFakeBluesky,
  json,
  postView,
  profileView,
  runAction,
  testAuth,
  xrpcError,
} from './helpers';

const AVATAR_CID = 'bafkreicfupviocmcmzznacnwlma5ddzbsanhu2gfxa72r6cu3lysbry5cm';

afterEach(() => {
  vi.unstubAllGlobals();
});

function createRecordRoute() {
  let n = 0;
  return () => {
    n += 1;
    return json({ uri: `at://${ME_DID}/app.bsky.feed.post/3new${n}`, cid: CID });
  };
}

function recordOf(body: unknown): Record<string, unknown> {
  if (typeof body === 'object' && body !== null && 'record' in body && typeof body.record === 'object' && body.record !== null) {
    return Object.fromEntries(Object.entries(body.record));
  }
  return {};
}

describe('Create Post', () => {
  it('posts 200 Japanese characters with real self-labels and hashtags as tags', async () => {
    const fake = installFakeBluesky({ routes: { 'com.atproto.repo.createRecord': createRecordRoute() } });
    const text = 'あ'.repeat(200);
    const result = await runAction({
      action: createPost,
      propsValue: { text, language: 'ja', additionalHashtags: 'tech,#bluesky', contentWarnings: ['adult', 'spam'], audience: 'followers' },
    });
    const [call] = fake.callsTo('com.atproto.repo.createRecord');
    const record = recordOf(call.body);
    expect(record['text']).toBe(`${text} #tech #bluesky`);
    expect(record['tags']).toEqual(['tech', 'bluesky']);
    expect(record['langs']).toEqual(['ja']);
    expect(record['labels']).toEqual({ $type: 'com.atproto.label.defs#selfLabels', values: [{ val: 'porn' }] });
    expect(result).toMatchObject({ success: true, totalPosts: 1, failedThreadPosts: [], url: `https://bsky.app/profile/${ME_HANDLE}/post/3new1` });
  });

  it('checks every thread text before posting anything', async () => {
    const fake = installFakeBluesky({ routes: { 'com.atproto.repo.createRecord': createRecordRoute() } });
    await expect(
      runAction({ action: createPost, propsValue: { text: 'AP-TEST', threadContent: ['ok', 'x'.repeat(301)] } }),
    ).rejects.toThrow(/Thread post 2 is 301 characters/);
    expect(fake.calls).toHaveLength(0);
  });

  it('reports a thread post Bluesky rejected instead of hiding it', async () => {
    let n = 0;
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.repo.createRecord': () => {
          n += 1;
          return n === 2
            ? xrpcError({ status: 400, error: 'InvalidRequest', message: 'bad record' })
            : json({ uri: `at://${ME_DID}/app.bsky.feed.post/3new${n}`, cid: CID });
        },
      },
    });
    const result = await runAction({ action: createPost, propsValue: { text: 'AP-TEST main', threadContent: ['one', 'two'] } });
    expect(result).toMatchObject({ totalPosts: 2, failedThreadPosts: [{ index: 1 }] });
    const third = recordOf(fake.callsTo('com.atproto.repo.createRecord')[2].body);
    expect(third['reply']).toEqual({ root: { uri: `at://${ME_DID}/app.bsky.feed.post/3new1`, cid: CID }, parent: { uri: `at://${ME_DID}/app.bsky.feed.post/3new1`, cid: CID } });
  });

  it('embeds a quoted post when Quote Post URL is set', async () => {
    const fake = installFakeBluesky({
      routes: {
        'app.bsky.feed.getPosts': () => json({ posts: [postView({ rkey: '3quoted', did: OTHER_DID })] }),
        'com.atproto.repo.createRecord': createRecordRoute(),
      },
    });
    await runAction({ action: createPost, propsValue: { text: 'AP-TEST quote', postType: 'quote', quotePostUrl: `at://${OTHER_DID}/app.bsky.feed.post/3quoted` } });
    const record = recordOf(fake.callsTo('com.atproto.repo.createRecord')[0].body);
    expect(record['embed']).toEqual({ $type: 'app.bsky.embed.record', record: { uri: `at://${OTHER_DID}/app.bsky.feed.post/3quoted`, cid: CID } });
  });
});

describe('Create Post (AI)', () => {
  it('rejects more than 8 tags before signing in', async () => {
    const fake = installFakeBluesky({ routes: {} });
    await expect(
      runAction({ action: blueskyCreatePost, propsValue: { text: 'AP-TEST', tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] } }),
    ).rejects.toThrow(/at most 8 tags/);
    expect(fake.calls).toHaveLength(0);
  });

  it('builds a reply with the parent thread root', async () => {
    const parent = postView({
      rkey: '3parent',
      extra: { record: { $type: 'app.bsky.feed.post', text: 'p', createdAt: '2026-10-05T10:00:00.000Z', reply: { root: { uri: `at://${OTHER_DID}/app.bsky.feed.post/3root`, cid: CID }, parent: { uri: `at://${OTHER_DID}/app.bsky.feed.post/3root`, cid: CID } } } },
    });
    const fake = installFakeBluesky({
      routes: { 'app.bsky.feed.getPosts': () => json({ posts: [parent] }), 'com.atproto.repo.createRecord': createRecordRoute() },
    });
    const result = await runAction({ action: blueskyCreatePost, propsValue: { text: 'AP-TEST reply', replyTo: `https://bsky.app/profile/${OTHER_DID}/post/3parent`, selfLabels: ['graphic-media'] } });
    const record = recordOf(fake.callsTo('com.atproto.repo.createRecord')[0].body);
    expect(record['reply']).toEqual({
      root: { uri: `at://${OTHER_DID}/app.bsky.feed.post/3root`, cid: CID },
      parent: { uri: `at://${OTHER_DID}/app.bsky.feed.post/3parent`, cid: CID },
    });
    expect(result).toMatchObject({ isReply: true, uri: `at://${ME_DID}/app.bsky.feed.post/3new1` });
  });
});

describe('Delete Post', () => {
  it('refuses a post of another account without deleting anything', async () => {
    const fake = installFakeBluesky({ routes: {} });
    await expect(runAction({ action: deletePost, propsValue: { post: `at://${OTHER_DID}/app.bsky.feed.post/3x` } })).rejects.toThrow(/another account/);
    expect(fake.callsTo('com.atproto.repo.deleteRecord')).toHaveLength(0);
  });

  it('converges when the post is already gone', async () => {
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.repo.getRecord': () => xrpcError({ status: 400, error: 'RecordNotFound', message: 'Could not locate record' }),
        'com.atproto.repo.deleteRecord': () => json({}),
      },
    });
    const result = await runAction({ action: deletePost, propsValue: { post: `https://bsky.app/profile/${ME_DID}/post/3gone` } });
    expect(result).toMatchObject({ deleted: true, existed: false, uri: `at://${ME_DID}/app.bsky.feed.post/3gone` });
    expect(fake.callsTo('com.atproto.repo.deleteRecord')[0].body).toEqual({ repo: ME_DID, collection: 'app.bsky.feed.post', rkey: '3gone' });
  });

  it('falls back to the profile lookup when the PDS cannot resolve the handle', async () => {
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.identity.resolveHandle': () => xrpcError({ status: 400, error: 'InvalidRequest', message: 'Unable to resolve handle' }),
        'app.bsky.actor.getProfile': () => json(profileView({ did: ME_DID, handle: ME_HANDLE })),
        'com.atproto.repo.getRecord': () => json({ uri: `at://${ME_DID}/app.bsky.feed.post/3mine`, cid: CID, value: {} }),
        'com.atproto.repo.deleteRecord': () => json({}),
      },
    });
    const result = await runAction({ action: deletePost, propsValue: { post: `https://bsky.app/profile/${ME_HANDLE}/post/3mine` } });
    expect(result).toMatchObject({ deleted: true, existed: true, uri: `at://${ME_DID}/app.bsky.feed.post/3mine` });
    expect(fake.callsTo('app.bsky.actor.getProfile')[0].query.get('actor')).toBe(ME_HANDLE);
  });

  it('reports the resolve error when the profile lookup also fails', async () => {
    installFakeBluesky({
      routes: {
        'com.atproto.identity.resolveHandle': () => xrpcError({ status: 400, error: 'InvalidRequest', message: 'Unable to resolve handle' }),
        'app.bsky.actor.getProfile': () => xrpcError({ status: 400, error: 'InvalidRequest', message: 'Profile not found' }),
      },
    });
    await expect(runAction({ action: deletePost, propsValue: { post: `https://bsky.app/profile/${ME_HANDLE}/post/3mine` } })).rejects.toThrow(
      /Unable to resolve handle/,
    );
  });
});

describe('likes and follows are check-first', () => {
  it('Like Post (AI) returns the existing like without creating another', async () => {
    const likeUri = `at://${ME_DID}/app.bsky.feed.like/3like`;
    const fake = installFakeBluesky({ routes: { 'app.bsky.feed.getPosts': () => json({ posts: [postView({ rkey: '3p', viewer: { like: likeUri } })] }) } });
    const result = await runAction({ action: blueskyLikePost, propsValue: { post: `at://${OTHER_DID}/app.bsky.feed.post/3p` } });
    expect(result).toMatchObject({ likeUri, alreadyLiked: true });
    expect(fake.callsTo('com.atproto.repo.createRecord')).toHaveLength(0);
  });

  it('Unlike Post changes nothing when the post is not liked', async () => {
    const fake = installFakeBluesky({ routes: { 'app.bsky.feed.getPosts': () => json({ posts: [postView({ rkey: '3p' })] }) } });
    const result = await runAction({ action: unlikePost, propsValue: { post: `at://${OTHER_DID}/app.bsky.feed.post/3p` } });
    expect(result).toEqual({ removed: false, postUri: `at://${OTHER_DID}/app.bsky.feed.post/3p`, likeUri: null });
    expect(fake.callsTo('com.atproto.repo.deleteRecord')).toHaveLength(0);
  });

  it('Follow User follows once and reports an existing follow', async () => {
    const followUri = `at://${ME_DID}/app.bsky.graph.follow/3f`;
    const fake = installFakeBluesky({
      routes: {
        'app.bsky.actor.getProfile': () => json(profileView()),
        'com.atproto.repo.createRecord': () => json({ uri: followUri, cid: CID }),
      },
    });
    const result = await runAction({ action: followUser, propsValue: { actor: '@other.bsky.social' } });
    expect(result).toEqual({ followUri, did: OTHER_DID, handle: OTHER_HANDLE, alreadyFollowing: false });
    expect(fake.callsTo('app.bsky.actor.getProfile')[0].query.get('actor')).toBe(OTHER_HANDLE);
    expect(fake.callsTo('com.atproto.repo.createRecord')[0].body).toMatchObject({ collection: 'app.bsky.graph.follow', record: { subject: OTHER_DID } });

    const again = installFakeBluesky({ routes: { 'app.bsky.actor.getProfile': () => json(profileView({ viewer: { following: followUri } })) } });
    expect(await runAction({ action: followUser, propsValue: { actor: OTHER_HANDLE } })).toMatchObject({ alreadyFollowing: true, followUri });
    expect(again.callsTo('com.atproto.repo.createRecord')).toHaveLength(0);
  });
});

describe('reads', () => {
  it('Search Posts sends every filter and returns a cursor page', async () => {
    const fake = installFakeBluesky({ routes: { 'app.bsky.feed.searchPosts': () => json({ posts: [postView({ rkey: '3s' })], cursor: 'next' }) } });
    const result = await runAction({
      action: searchPosts,
      propsValue: { query: 'activepieces', sort: 'top', author: '@other.bsky.social', tags: ['#ai'], since: '2026-10-01T00:00:00Z', limit: 10 },
    });
    const query = fake.callsTo('app.bsky.feed.searchPosts')[0].query;
    expect(query.get('q')).toBe('activepieces');
    expect(query.get('sort')).toBe('top');
    expect(query.get('author')).toBe(OTHER_HANDLE);
    expect(query.getAll('tag')).toEqual(['ai']);
    expect(query.get('since')).toBe('2026-10-01T00:00:00.000Z');
    expect(query.get('limit')).toBe('10');
    expect(result).toMatchObject({ cursor: 'next', hasMore: true, items: [{ text: 'hello', url: `https://bsky.app/profile/${OTHER_HANDLE}/post/3s` }] });
  });

  it('rejects an out-of-range limit before signing in', async () => {
    const fake = installFakeBluesky({ routes: {} });
    await expect(runAction({ action: getTimeline, propsValue: { limit: 500 } })).rejects.toThrow(/between 1 and 100/);
    expect(fake.calls).toHaveLength(0);
  });

  it('turns a rate limit into a clear error without a body field', async () => {
    installFakeBluesky({
      routes: { 'app.bsky.feed.getTimeline': () => xrpcError({ status: 429, error: 'RateLimitExceeded', message: 'Rate Limit Exceeded', headers: { 'ratelimit-reset': '1790000000' } }) },
    });
    const error = await runAction({ action: getTimeline, propsValue: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toMatch(/rate limit reached while trying to get the timeline/);
    expect(error).not.toHaveProperty('body');
    expect(error).toHaveProperty('status', 429);
  });

  it('Find Thread counts every post in the thread', async () => {
    const thread = {
      $type: 'app.bsky.feed.defs#threadViewPost',
      post: postView({ rkey: '3root' }),
      parent: { $type: 'app.bsky.feed.defs#threadViewPost', post: postView({ rkey: '3up' }) },
      replies: [
        { $type: 'app.bsky.feed.defs#threadViewPost', post: postView({ rkey: '3r1' }), replies: [{ $type: 'app.bsky.feed.defs#threadViewPost', post: postView({ rkey: '3r2' }) }] },
        { $type: 'app.bsky.feed.defs#notFoundPost', uri: `at://${OTHER_DID}/app.bsky.feed.post/3gone`, notFound: true },
      ],
    };
    const fake = installFakeBluesky({ routes: { 'app.bsky.feed.getPostThread': () => json({ thread }) } });
    const result = await runAction({ action: findThread, propsValue: { postUrl: `at://${OTHER_DID}/app.bsky.feed.post/3root` } });
    expect(result).toMatchObject({ statistics: { totalPosts: 4, parentPosts: 1, replyPosts: 2, notFoundPosts: 1, blockedPosts: 0 }, parameters: { depth: 10, parentHeight: 3 } });
    expect(fake.callsTo('app.bsky.feed.getPostThread')[0].query.get('depth')).toBe('10');
  });
});

describe('writes with three states', () => {
  it('Update Profile keeps every untouched field (even an avatar the lexicon would reject), sets given ones and clears on request', async () => {
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.repo.getRecord': () =>
          json({
            uri: `at://${ME_DID}/app.bsky.actor.profile/self`,
            cid: CID,
            value: {
              $type: 'app.bsky.actor.profile',
              displayName: 'Old',
              description: 'Old bio',
              avatar: { $type: 'blob', ref: { $link: AVATAR_CID }, mimeType: 'image/webp', size: 2_000_000 },
              pinnedPost: { uri: `at://${ME_DID}/app.bsky.feed.post/3pin`, cid: CID },
            },
          }),
        'com.atproto.repo.putRecord': () => json({ uri: `at://${ME_DID}/app.bsky.actor.profile/self`, cid: CID }),
      },
    });
    const result = await runAction({ action: updateProfile, propsValue: { displayName: 'New', clearDescription: true } });
    const record = recordOf(fake.callsTo('com.atproto.repo.putRecord')[0].body);
    expect(record['displayName']).toBe('New');
    expect(record).not.toHaveProperty('description');
    expect(record['avatar']).toEqual({ $type: 'blob', ref: { $link: AVATAR_CID }, mimeType: 'image/webp', size: 2_000_000 });
    expect(record['pinnedPost']).toEqual({ uri: `at://${ME_DID}/app.bsky.feed.post/3pin`, cid: CID });
    expect(fake.callsTo('com.atproto.repo.putRecord')[0].body).toMatchObject({ swapRecord: CID, rkey: 'self' });
    expect(result).toMatchObject({ displayName: 'New', description: '', avatarUpdated: false });
  });

  it('Update Profile refuses an empty request', async () => {
    installFakeBluesky({ routes: {} });
    await expect(runAction({ action: updateProfile, propsValue: {} })).rejects.toThrow(/Nothing to update/);
  });

  it('Remove User from List deletes every membership of that account only', async () => {
    const listUri = `at://${ME_DID}/app.bsky.graph.list/3lst`;
    const fake = installFakeBluesky({
      routes: {
        'app.bsky.graph.getList': () =>
          json({
            list: { uri: listUri, cid: CID, name: 'AP-TEST', purpose: 'app.bsky.graph.defs#curatelist', creator: profileView({ did: ME_DID, handle: ME_HANDLE }), indexedAt: '2026-10-05T10:00:00.000Z' },
            items: [
              { uri: `at://${ME_DID}/app.bsky.graph.listitem/3i1`, subject: profileView() },
              { uri: `at://${ME_DID}/app.bsky.graph.listitem/3i2`, subject: profileView({ did: 'did:plc:cccccccccccccccccccccccc', handle: 'third.bsky.social' }) },
              { uri: `at://${ME_DID}/app.bsky.graph.listitem/3i3`, subject: profileView() },
            ],
          }),
        'com.atproto.repo.deleteRecord': () => json({}),
      },
    });
    const result = await runAction({ action: removeUserFromList, propsValue: { list: listUri, actor: OTHER_DID } });
    expect(result).toEqual({ removed: 2, listUri, did: OTHER_DID });
    expect(fake.callsTo('com.atproto.repo.deleteRecord').map((c) => c.body)).toEqual([
      { repo: ME_DID, collection: 'app.bsky.graph.listitem', rkey: '3i1' },
      { repo: ME_DID, collection: 'app.bsky.graph.listitem', rkey: '3i3' },
    ]);
  });
});

describe('Delete List', () => {
  const listUri = `at://${ME_DID}/app.bsky.graph.list/3lst`;
  const otherListUri = `at://${ME_DID}/app.bsky.graph.list/3other`;
  const listItems = [
    ...Array.from({ length: 120 }, (_, index) => ({ rkey: `3m${index}`, list: listUri })),
    ...Array.from({ length: 30 }, (_, index) => ({ rkey: `3o${index}`, list: otherListUri })),
  ].map(({ rkey, list }) => ({
    uri: `at://${ME_DID}/app.bsky.graph.listitem/${rkey}`,
    cid: CID,
    value: { $type: 'app.bsky.graph.listitem', subject: OTHER_DID, list, createdAt: '2026-10-05T10:00:00.000Z' },
  }));
  const listRecordsRoute = ({ records }: { records: typeof listItems }) => (call: { query: URLSearchParams }) => {
    const offset = Number(call.query.get('cursor') ?? '0');
    const page = records.slice(offset, offset + 100);
    return json({ records: page, ...(offset + 100 < records.length ? { cursor: String(offset + 100) } : {}) });
  };
  const deletedRkeys = (body: unknown): string[] =>
    typeof body === 'object' && body !== null && 'writes' in body && Array.isArray(body.writes)
      ? body.writes.flatMap((write: unknown) => (typeof write === 'object' && write !== null && 'rkey' in write && typeof write.rkey === 'string' ? [write.rkey] : []))
      : [];

  it('removes every membership of the list from the repository, then deletes the list', async () => {
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.repo.getRecord': () => json({ uri: listUri, cid: CID, value: {} }),
        'com.atproto.repo.listRecords': listRecordsRoute({ records: listItems }),
        'com.atproto.repo.applyWrites': () => json({}),
        'com.atproto.repo.deleteRecord': () => json({}),
      },
    });
    const result = await runAction({ action: deleteList, propsValue: { list: listUri } });
    expect(result).toEqual({ deleted: true, existed: true, uri: listUri, membersRemoved: 120, membersFailed: 0, membersComplete: true });
    expect(fake.callsTo('com.atproto.repo.listRecords')).toHaveLength(2);
    expect(fake.callsTo('com.atproto.repo.listRecords')[0].query.get('collection')).toBe('app.bsky.graph.listitem');
    const removed = fake.callsTo('com.atproto.repo.applyWrites').flatMap((call) => deletedRkeys(call.body));
    expect(removed).toHaveLength(120);
    expect(removed.every((rkey) => rkey.startsWith('3m'))).toBe(true);
    const order = fake.calls.map((call) => call.nsid).filter((nsid) => nsid === 'com.atproto.repo.applyWrites' || nsid === 'com.atproto.repo.deleteRecord');
    expect(order).toEqual(['com.atproto.repo.applyWrites', 'com.atproto.repo.applyWrites', 'com.atproto.repo.deleteRecord']);
    expect(fake.callsTo('com.atproto.repo.deleteRecord')[0].body).toEqual({ repo: ME_DID, collection: 'app.bsky.graph.list', rkey: '3lst' });
  });

  it('stops on a failed batch and keeps the list so a retry can finish', async () => {
    let batch = 0;
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.repo.getRecord': () => json({ uri: listUri, cid: CID, value: {} }),
        'com.atproto.repo.listRecords': listRecordsRoute({ records: listItems }),
        'com.atproto.repo.applyWrites': () => {
          batch += 1;
          return batch === 2 ? xrpcError({ status: 500, error: 'InternalServerError', message: 'boom' }) : json({});
        },
        'com.atproto.repo.deleteRecord': () => json({}),
      },
    });
    await expect(runAction({ action: deleteList, propsValue: { list: listUri } })).rejects.toThrow(
      /Removed 100 of 120 list memberships, then Bluesky refused the next batch\. The list was not deleted; run the action again to finish\./,
    );
    expect(fake.callsTo('com.atproto.repo.deleteRecord')).toHaveLength(0);
  });

  it('cleans up leftover memberships when the list is already gone', async () => {
    const leftovers = listItems.slice(100);
    const fake = installFakeBluesky({
      routes: {
        'com.atproto.repo.getRecord': () => xrpcError({ status: 400, error: 'RecordNotFound', message: 'Could not locate record' }),
        'com.atproto.repo.listRecords': listRecordsRoute({ records: leftovers }),
        'com.atproto.repo.applyWrites': () => json({}),
        'com.atproto.repo.deleteRecord': () => json({}),
      },
    });
    const result = await runAction({ action: deleteList, propsValue: { list: listUri } });
    expect(result).toEqual({ deleted: true, existed: false, uri: listUri, membersRemoved: 20, membersFailed: 0, membersComplete: true });
    expect(fake.callsTo('com.atproto.repo.applyWrites').flatMap((call) => deletedRkeys(call.body))).toHaveLength(20);
    expect(fake.callsTo('com.atproto.repo.deleteRecord')).toHaveLength(0);
  });

  it('refuses a list of another account before touching anything', async () => {
    const fake = installFakeBluesky({ routes: {} });
    await expect(runAction({ action: deleteList, propsValue: { list: `at://${OTHER_DID}/app.bsky.graph.list/3lst` } })).rejects.toThrow(/belongs to another account/);
    expect(fake.callsTo('com.atproto.repo.listRecords')).toHaveLength(0);
  });
});

describe('session handling', () => {
  it('signs in once per process and again when the password changes', async () => {
    const fake = installFakeBluesky({ routes: { 'app.bsky.feed.getTimeline': () => json({ feed: [] }) } });
    await runAction({ action: getTimeline, propsValue: {} });
    await runAction({ action: getTimeline, propsValue: {} });
    expect(fake.callsTo('com.atproto.server.createSession')).toHaveLength(1);
    await blueskyClient.createAgent(testAuth({ password: 'rotated-pass' }).props);
    expect(fake.callsTo('com.atproto.server.createSession')).toHaveLength(2);
  });

  it('Custom API Call refuses a full URL on another host', async () => {
    installFakeBluesky({ routes: {} });
    const action = bluesky.getAction('custom_api_call');
    if (!action) {
      throw new Error('custom_api_call is missing');
    }
    await expect(
      runAction({ action, propsValue: { url: { url: 'https://bsky.social.evil.io/xrpc/app.bsky.actor.getProfile' }, method: 'GET', headers: {}, queryParams: {} } }),
    ).rejects.toThrow(/PDS host/);
  });
});
