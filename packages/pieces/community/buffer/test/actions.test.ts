import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buffer } from '../src/index';
import { createPost } from '../src/lib/actions/create-post';
import { createIdea } from '../src/lib/actions/create-idea';
import { createPostAi } from '../src/lib/actions/ai/create-post-ai';
import { editPost } from '../src/lib/actions/ai/edit-post';
import { deletePost } from '../src/lib/actions/ai/delete-post';
import { listPosts } from '../src/lib/actions/ai/list-posts';
import { listIdeas } from '../src/lib/actions/ai/list-ideas';
import { getPostMetrics } from '../src/lib/actions/ai/get-post-metrics';
import { bufferQueries } from '../src/lib/common/queries';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { type: AppConnectionType.SECRET_TEXT, secret_text: 'key' };
const ORG = '6af2a971a3a2f050dcb3e258';

function ok({ data }: { data: unknown }) {
  return { status: 200, headers: {}, body: { data } };
}

function call<T>({ fn, propsValue }: { fn: (ctx: never) => Promise<T>; propsValue: Record<string, unknown> }): Promise<T> {
  return Reflect.apply(fn, undefined, [{ auth: AUTH, propsValue }]);
}

function variablesOf({ index }: { index: number }) {
  return sendRequest.mock.calls[index][0].body.variables;
}

function queryOf({ index }: { index: number }): string {
  return sendRequest.mock.calls[index][0].body.query;
}

function created({ id, channelId }: { id: string; channelId: string }) {
  return ok({ data: { createPost: { __typename: 'PostActionSuccess', post: { id, text: 't', status: 'draft', dueAt: null, sentAt: null, channelId } } } });
}

function stored({ post }: { post: unknown }) {
  return ok({ data: { post } });
}

function edited({ id }: { id: string }) {
  return ok({ data: { editPost: { __typename: 'PostActionSuccess', post: { id } } } });
}

const LIVE_BLUESKY = '6af2cb1e62b70b94b0dec8fb';
const LIVE_YOUTUBE = '6af2c9c162b70b94b0dec00f';

const LIVE_BLUESKY_LINK_POST = {
  id: '6af2d165b59b34913a662660',
  text: 'ap-live-test link card (AI create)',
  channelService: 'bluesky',
  assets: [],
  metadata: { __typename: 'BlueskyPostMetadata' },
};

const LIVE_YOUTUBE_POST = {
  id: '6af2d17626f9e6aeeaf3352d',
  text: 'ap-live-test link appended (AI create)\n\nhttps://www.activepieces.com',
  channelService: 'youtube',
  assets: [],
  metadata: {
    __typename: 'YoutubePostMetadata',
    title: 'ap-live-test',
    privacy: 'private',
    license: 'youtube',
    madeForKids: false,
    notifySubscribers: true,
    embeddable: true,
    isAiGenerated: false,
    category: { categoryId: '22' },
  },
};

beforeEach(() => {
  sendRequest.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('piece metadata', () => {
  it('sets the release floor and registers every action and trigger', () => {
    expect(buffer.minimumSupportedRelease).toBe('0.88.2');
    expect(Object.keys(buffer.actions()).sort()).toEqual([
      'create_idea', 'create_post', 'create_post_ai', 'custom_api_call', 'delete_post', 'edit_post', 'get_channel',
      'get_post', 'get_post_metrics', 'list_channels', 'list_idea_groups', 'list_ideas', 'list_organizations',
      'list_posts', 'list_tags',
    ]);
    expect(Object.keys(buffer.triggers()).sort()).toEqual(['new_channel', 'new_queue_item', 'new_sent_item']);
  });

  it('demotes create_post to human, keeps create_idea for both, and exposes the rest to agents only', () => {
    const actions = buffer.actions();
    expect(actions['create_post'].audience).toBe('human');
    expect(actions['custom_api_call'].audience).toBe('human');
    expect(actions['create_idea'].audience).toBe('both');
    const agentOnly = Object.values(actions).filter((action) => action.audience === 'ai').map((action) => action.name).sort();
    expect(agentOnly).toEqual([
      'create_post_ai', 'delete_post', 'edit_post', 'get_channel', 'get_post', 'get_post_metrics', 'list_channels',
      'list_idea_groups', 'list_ideas', 'list_organizations', 'list_posts', 'list_tags',
    ]);
    for (const action of Object.values(actions)) {
      if (action.name !== 'custom_api_call') {
        expect(action.outputSchema, action.name).toBeDefined();
      }
    }
    for (const trigger of Object.values(buffer.triggers())) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });

  it('names only registered display names in agent prose', () => {
    const names = new Set(Object.values(buffer.actions()).map((action) => action.displayName));
    const prose = Object.values(buffer.actions()).map((action) => action.aiMetadata?.description ?? '').join(' ');
    const mentioned = ['List Organizations', 'List Channels', 'Get a Channel', 'List Posts', 'Get a Post', 'Create a Post', 'Edit a Post', 'Delete a Post', 'List Ideas', 'List Idea Groups', 'Get Post Metrics', 'List Tags', 'Create Idea'];
    for (const name of mentioned) {
      expect(names.has(name), name).toBe(true);
    }
    expect(prose).not.toContain('Idea Bank');
  });

  it('keeps every create_post prop name and every share-mode and scheduling value main accepted', () => {
    expect(Object.keys(createPost.props)).toEqual(['organizationId', 'channelIds', 'text', 'mode', 'dueAt', 'schedulingType', 'saveToDraft', 'imageUrls', 'linkUrl', 'youtubeTitle', 'youtubeCategoryId']);
    expect(createPost.props.youtubeTitle.required).toBe(false);
    expect(createPost.props.youtubeCategoryId.required).toBe(false);
    expect(createPost.props.youtubeCategoryId.defaultValue).toBeUndefined();
    expect(createPost.props.mode.options.options.map((option) => option.value)).toEqual(['addToQueue', 'shareNext', 'shareNow', 'customScheduled']);
    expect(createPost.props.schedulingType.options.options.map((option) => option.value)).toEqual(['automatic', 'notification']);
    expect(Object.keys(createIdea.props)).toEqual(['organizationId', 'groupId', 'title', 'text', 'imageUrls', 'aiAssisted']);
  });
});

describe('create_post (human)', () => {
  it('lists the posts already created when a later channel fails, so a retry does not double-post blindly', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: 'c1', name: 'A', service: 'bluesky' }, { id: 'c2', name: 'B', service: 'mastodon' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: 'c1' }))
      .mockResolvedValueOnce(ok({ data: { createPost: { __typename: 'LimitReachedError', message: 'Queue is full' } } }));
    const promise = call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['c1', 'c2'], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic' } });
    await expect(promise).rejects.toThrow('Buffer rejected the post for channel c2: Queue is full. These posts were already created before the failure, so running the step again would post them twice: p1 (channel c1).');
  });

  it('sends a link as a Bluesky link card in metadata, never as the deprecated assets.link, and drops blank image entries', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: 'c1', name: 'A', service: 'bluesky' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: 'c1' }));
    const result = await call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['c1'], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic', imageUrls: [' '], linkUrl: 'https://a.io' } });
    expect(variablesOf({ index: 1 }).input).toEqual({
      channelId: 'c1',
      text: 'hi',
      mode: 'addToQueue',
      schedulingType: 'automatic',
      assets: [],
      metadata: { bluesky: { linkAttachment: { url: 'https://a.io' } } },
    });
    expect(result).toEqual({ posts: [{ __typename: 'PostActionSuccess', post: { id: 'p1', text: 't', status: 'draft', dueAt: null, sentAt: null, channelId: 'c1' } }] });
  });

  it('live ❌2: refuses a YouTube channel without title and category before creating any post', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { channels: [{ id: LIVE_BLUESKY, name: 'odaiactive.bsky.social', service: 'bluesky' }, { id: LIVE_YOUTUBE, name: 'Odai Thalji', service: 'youtube' }] } }));
    await expect(call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: [LIVE_BLUESKY, LIVE_YOUTUBE], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic', saveToDraft: true, youtubeTitle: 'Clip' } }))
      .rejects.toThrow(`YouTube Title and YouTube Category are required when a YouTube channel is selected (${LIVE_YOUTUBE}). Nothing was created.`);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('live ❌2: sends metadata.youtube only to the YouTube channel and keeps the Bluesky card', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: LIVE_BLUESKY, name: 'odaiactive.bsky.social', service: 'bluesky' }, { id: LIVE_YOUTUBE, name: 'Odai Thalji', service: 'youtube' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: LIVE_BLUESKY }))
      .mockResolvedValueOnce(created({ id: 'p2', channelId: LIVE_YOUTUBE }));
    await call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: [LIVE_BLUESKY, LIVE_YOUTUBE], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic', saveToDraft: true, linkUrl: 'https://a.io', youtubeTitle: ' Clip ', youtubeCategoryId: '22' } });
    expect(variablesOf({ index: 1 }).input.metadata).toEqual({ bluesky: { linkAttachment: { url: 'https://a.io' } } });
    expect(variablesOf({ index: 2 }).input).toEqual({
      channelId: LIVE_YOUTUBE, text: 'hi\n\nhttps://a.io', mode: 'addToQueue', schedulingType: 'automatic', assets: [], saveToDraft: true,
      metadata: { youtube: { title: 'Clip', categoryId: '22' } },
    });
  });

  it('ignores the YouTube props when no YouTube channel is selected', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: 'm1', name: 'M', service: 'mastodon' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: 'm1' }));
    await call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['m1'], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic', youtubeTitle: 'Clip' } });
    expect(variablesOf({ index: 1 }).input).toEqual({ channelId: 'm1', text: 'hi', mode: 'addToQueue', schedulingType: 'automatic', assets: [] });
  });

  it('still requires a scheduled time for custom scheduling before any request', async () => {
    await expect(call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['c1'], text: 'hi', mode: 'customScheduled', schedulingType: 'automatic' } })).rejects.toThrow('Scheduled Time is required');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('create_post_ai', () => {
  it('treats a Scheduled For time alone as customScheduled and sends saveToDraft only for yes', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createPost: { __typename: 'PostActionSuccess', post: { id: 'p9' } } } }));
    const post = await call({ fn: createPostAi.run, propsValue: { channelId: ' c1 ', text: 'hi', dueAt: '2026-12-01T11:00:00+02:00', saveToDraft: 'yes' } });
    expect(post).toEqual({ id: 'p9' });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(variablesOf({ index: 0 }).input).toEqual({
      channelId: 'c1', mode: 'customScheduled', schedulingType: 'automatic', assets: [], text: 'hi', dueAt: '2026-12-01T09:00:00.000Z', saveToDraft: true,
    });
  });

  it('has no Share Mode default and treats an empty mode with a future time as customScheduled', async () => {
    expect(createPostAi.props.mode.defaultValue).toBeUndefined();
    sendRequest.mockResolvedValueOnce(ok({ data: { createPost: { __typename: 'PostActionSuccess', post: { id: 'p10' } } } }));
    await call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi', mode: '', dueAt: '2099-01-01T09:00:00Z' } });
    expect(variablesOf({ index: 0 }).input).toMatchObject({ mode: 'customScheduled', dueAt: '2099-01-01T09:00:00.000Z' });
  });

  it('refuses shareNow with a scheduled time, a past time, and an unknown mode without calling Buffer', async () => {
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi', mode: 'shareNow', dueAt: '2026-12-01T09:00:00Z' } })).rejects.toThrow('only works with Share Mode customScheduled');
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi', dueAt: '2026-11-01T09:00:00Z' } })).rejects.toThrow('not in the future');
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi', mode: 'now' } })).rejects.toThrow('Share Mode must be one of');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('looks up the channel service only when a link is given, then builds the card', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channel: { id: 'c1', service: 'facebook', organizationId: ORG } } }))
      .mockResolvedValueOnce(ok({ data: { createPost: { __typename: 'PostActionSuccess', post: { id: 'p1' } } } }));
    await call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi', linkUrl: 'https://a.io' } });
    expect(queryOf({ index: 0 })).toContain('channel(input: { id: $id })');
    expect(variablesOf({ index: 1 }).input.metadata).toEqual({ facebook: { type: 'post', linkAttachment: { url: 'https://a.io' } } });
  });

  it('fails with the typed mutation error when nothing was created', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createPost: { __typename: 'NotFoundError', message: 'Channel not found' } } }));
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi' } })).rejects.toThrow('Buffer did not create the post (NotFoundError): Channel not found');
  });
});

describe('edit_post', () => {
  it('sends only the fields given when the post is not on YouTube', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { id: 'p1', text: 'old', channelService: 'mastodon', assets: [], metadata: { __typename: 'MastodonPostMetadata' } } }))
      .mockResolvedValueOnce(edited({ id: 'p1' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p1', text: 'new', clearMedia: 'no', saveToDraft: 'no' } });
    expect(queryOf({ index: 0 })).toContain('query PostEditSource');
    expect(variablesOf({ index: 0 })).toEqual({ id: 'p1' });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p1', text: 'new' });
  });

  it('drops the empty values the agent path fills in, so media, tags and metadata are kept', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { id: 'p1', text: 'old', channelService: 'mastodon', assets: [], metadata: null } }))
      .mockResolvedValueOnce(edited({ id: 'p1' }));
    await call({
      fn: editPost.run,
      propsValue: { postId: 'p1', text: 'new', imageUrls: [], tagIds: [], metadata: {}, clearMedia: 'no', saveToDraft: 'no' },
    });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p1', text: 'new' });
  });

  it('clears media with an empty assets list, keeps the stored text, and moves the time with customScheduled', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { id: 'p1', text: 'old', channelService: 'mastodon', assets: [], metadata: null } }))
      .mockResolvedValueOnce(edited({ id: 'p1' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p1', clearMedia: 'yes', dueAt: '2026-12-02T09:00:00Z' } });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p1', text: 'old', dueAt: '2026-12-02T09:00:00.000Z', mode: 'customScheduled', assets: [] });
  });

  it('live ❌1: a time-only edit of a Bluesky link-card post resends the stored text and leaves the card metadata out', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: LIVE_BLUESKY_LINK_POST }))
      .mockResolvedValueOnce(edited({ id: LIVE_BLUESKY_LINK_POST.id }));
    await call({ fn: editPost.run, propsValue: { postId: LIVE_BLUESKY_LINK_POST.id, dueAt: '2026-12-30T10:30:00Z' } });
    expect(variablesOf({ index: 1 }).input).toEqual({
      id: LIVE_BLUESKY_LINK_POST.id,
      text: 'ap-live-test link card (AI create)',
      dueAt: '2026-12-30T10:30:00.000Z',
      mode: 'customScheduled',
    });
  });

  it('live ❌1: a text-only edit of a YouTube post resends the stored YouTube settings', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: LIVE_YOUTUBE_POST }))
      .mockResolvedValueOnce(edited({ id: LIVE_YOUTUBE_POST.id }));
    await call({ fn: editPost.run, propsValue: { postId: LIVE_YOUTUBE_POST.id, text: 'ap-live-test yt EDITED' } });
    expect(variablesOf({ index: 1 }).input).toEqual({
      id: LIVE_YOUTUBE_POST.id,
      text: 'ap-live-test yt EDITED',
      metadata: {
        youtube: {
          title: 'ap-live-test', privacy: 'private', license: 'youtube', madeForKids: false, notifySubscribers: true, embeddable: true,
          isAiGenerated: false, categoryId: '22',
        },
      },
    });
  });

  it('merges a given youtube object over the stored settings and keeps other given services', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: LIVE_YOUTUBE_POST }))
      .mockResolvedValueOnce(edited({ id: LIVE_YOUTUBE_POST.id }));
    await call({ fn: editPost.run, propsValue: { postId: LIVE_YOUTUBE_POST.id, metadata: { youtube: { title: 'New title' } } } });
    const input = variablesOf({ index: 1 }).input;
    expect(input.text).toBe('ap-live-test link appended (AI create)\n\nhttps://www.activepieces.com');
    expect(input.metadata.youtube).toMatchObject({ title: 'New title', categoryId: '22', privacy: 'private' });
  });

  it('resends the stored media when the post has no text and only the time changes', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({
        post: {
          id: 'p2', text: '', channelService: 'instagram', metadata: { __typename: 'InstagramPostMetadata' },
          assets: [
            { type: 'image', source: 'https://cdn.io/a.png', thumbnail: 'https://cdn.io/a_t.png', image: { altText: 'A cat' } },
            { type: 'video', source: 'https://cdn.io/v.mp4', thumbnail: 'https://cdn.io/v_t.png', video: { title: 'clip', thumbnailOffset: 1200 } },
          ],
        },
      }))
      .mockResolvedValueOnce(edited({ id: 'p2' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p2', dueAt: '2026-12-30T10:30:00Z' } });
    expect(variablesOf({ index: 1 }).input).toEqual({
      id: 'p2',
      dueAt: '2026-12-30T10:30:00.000Z',
      mode: 'customScheduled',
      assets: [
        { image: { url: 'https://cdn.io/a.png', thumbnailUrl: 'https://cdn.io/a_t.png', metadata: { altText: 'A cat' } } },
        { video: { url: 'https://cdn.io/v.mp4', metadata: { title: 'clip', thumbnailOffset: 1200 } } },
      ],
    });
  });

  it('fails before editing when the post cannot be loaded', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { post: null }, errors: [{ message: 'Post not found for id: p404', extensions: { code: 'NOT_FOUND' } }] } });
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p404', dueAt: '2026-12-30T10:30:00Z' } })).rejects.toThrow('Post not found for id: p404');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('refuses an edit with nothing to change', async () => {
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p1' } })).rejects.toThrow('at least one field');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('post metadata selection', () => {
  it('get_post, list_posts, create and edit select the link card on every card service and the YouTube settings', () => {
    for (const document of [bufferQueries.POST, bufferQueries.POSTS, bufferQueries.CREATE_POST, bufferQueries.EDIT_POST]) {
      for (const member of ['FacebookPostMetadata', 'LinkedInPostMetadata', 'ThreadsPostMetadata', 'BlueskyPostMetadata', 'SubstackPostMetadata']) {
        expect(document).toContain(`... on ${member} { linkAttachment { url title text thumbnail } }`);
      }
      expect(document).toContain('... on YoutubePostMetadata { title privacy category { categoryId title } }');
    }
    expect(bufferQueries.POST_EDIT_SOURCE).toContain('category { categoryId }');
    expect(bufferQueries.POST_EDIT_SOURCE).toContain('... on ImageAsset { image { altText } }');
  });
});

describe('delete_post', () => {
  it('returns the deleted id', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { deletePost: { __typename: 'DeletePostSuccess', id: 'p1' } } }));
    await expect(call({ fn: deletePost.run, propsValue: { postId: 'p1' } })).resolves.toEqual({ id: 'p1', deleted: true });
  });

  it('fails on the live VoidMutationError shape for a missing post', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { deletePost: { __typename: 'VoidMutationError', message: 'Document not found' } } }));
    await expect(call({ fn: deletePost.run, propsValue: { postId: 'p1' } })).rejects.toThrow('(VoidMutationError): Document not found');
  });
});

describe('list actions', () => {
  it('builds the posts filter, sort and page variables and returns a cursor only when there is a next page', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { posts: { edges: [{ node: { id: 'p1' } }], pageInfo: { endCursor: 'c-1', hasNextPage: false } } } }));
    const result = await call({ fn: listPosts.run, propsValue: { organizationId: ORG, status: ['sent'], channelIds: ['c1'], tagIds: ['t1'], dueAfter: '2026-10-01T00:00:00Z', sortBy: 'dueAt', sortDirection: 'asc', limit: 50, cursor: 'abc', includeMetrics: 'yes' } });
    expect(variablesOf({ index: 0 })).toEqual({
      input: {
        organizationId: ORG,
        filter: { status: ['sent'], channelIds: ['c1'], tags: { in: ['t1'] }, dueAt: { start: '2026-10-01T00:00:00.000Z' } },
        sort: [{ field: 'dueAt', direction: 'asc' }],
      },
      first: 50,
      after: 'abc',
      withMetrics: true,
    });
    expect(result).toEqual({ posts: [{ id: 'p1' }], nextCursor: null, hasNextPage: false });
  });

  it('passes the ideas cursor on the next page', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { ideas: { edges: [], pageInfo: { endCursor: 'n2', hasNextPage: true } } } }));
    const result = await call({ fn: listIdeas.run, propsValue: { organizationId: ORG, cursor: 'n1', membership: 'ungrouped' } });
    expect(variablesOf({ index: 0 })).toEqual({ input: { organizationId: ORG, groupFilter: { membership: 'ungrouped' } }, first: 20, after: 'n1' });
    expect(result).toEqual({ ideas: [], nextCursor: 'n2', hasNextPage: true });
  });

  it('rejects Group IDs together with Board Column before calling Buffer', async () => {
    await expect(call({ fn: listIdeas.run, propsValue: { organizationId: ORG, groupIds: ['g1'], membership: 'grouped' } })).rejects.toThrow('Give either Group IDs or Board Column, not both');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('action edge cases (QA)', () => {
  it('create_post: a transport error on a later channel still lists the posts already created and is not retried', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: 'c1', name: 'A', service: 'bluesky' }, { id: 'c2', name: 'B', service: 'bluesky' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: 'c1' }))
      .mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['c1', 'c2'], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic' } }))
      .rejects.toThrow('could not reach api.buffer.com (fetch failed). These posts were already created before the failure, so running the step again would post them twice: p1 (channel c1).');
    expect(sendRequest).toHaveBeenCalledTimes(3);
  });

  it('create_post: adds the Facebook post type per channel and appends the link for a channel outside the organization list', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: 'fb', name: 'Page', service: 'facebook' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: 'fb' }))
      .mockResolvedValueOnce(created({ id: 'p2', channelId: 'zz' }));
    await call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['fb', 'zz'], text: 'hi', mode: 'customScheduled', dueAt: '2026-12-01T09:00:00.000Z', schedulingType: 'automatic', saveToDraft: false, imageUrls: ['https://i.io/a.png'], linkUrl: 'https://a.io' } });
    expect(variablesOf({ index: 1 }).input).toEqual({
      channelId: 'fb', text: 'hi\n\nhttps://a.io', mode: 'customScheduled', schedulingType: 'automatic',
      assets: [{ image: { url: 'https://i.io/a.png' } }], metadata: { facebook: { type: 'post' } }, dueAt: '2026-12-01T09:00:00.000Z',
    });
    expect(variablesOf({ index: 2 }).input).toEqual({
      channelId: 'zz', text: 'hi\n\nhttps://a.io', mode: 'customScheduled', schedulingType: 'automatic',
      assets: [{ image: { url: 'https://i.io/a.png' } }], dueAt: '2026-12-01T09:00:00.000Z',
    });
  });

  it('create_post_ai: refuses an empty post and a non-http image before calling Buffer', async () => {
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: '  ', imageUrls: [''] } })).rejects.toThrow('Give the post a Text, an image or a link');
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', imageUrls: ['ftp://x.io/a.png'] } })).rejects.toThrow('must start with http');
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: '  ', text: 'hi' } })).rejects.toThrow('Channel ID is required');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('create_post_ai: customScheduled without a time is refused before calling Buffer', async () => {
    await expect(call({ fn: createPostAi.run, propsValue: { channelId: 'c1', text: 'hi', mode: 'customScheduled' } })).rejects.toThrow('Scheduled For is required');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('edit_post: refuses Image URLs together with Clear Media, and an unknown scheduling type', async () => {
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p1', imageUrls: ['https://i.io/a.png'], clearMedia: 'yes' } })).rejects.toThrow('not both');
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p1', schedulingType: 'manual' } })).rejects.toThrow('Scheduling Type must be one of');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('edit_post: a typed mutation error fails the step', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { id: 'p1', text: 'old', channelService: 'mastodon', assets: [], metadata: null } }))
      .mockResolvedValueOnce(ok({ data: { editPost: { __typename: 'NotFoundError', message: 'Post not found' } } }));
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p1', text: 'x' } })).rejects.toThrow('Buffer did not change post p1 (NotFoundError): Post not found');
  });

  it('list_posts: refuses a page size over 100 and an inverted window before calling Buffer', async () => {
    await expect(call({ fn: listPosts.run, propsValue: { organizationId: ORG, limit: 500 } })).rejects.toThrow('1 to 100');
    await expect(call({ fn: listPosts.run, propsValue: { organizationId: ORG, dueAfter: '2026-12-02T00:00:00Z', dueBefore: '2026-12-01T00:00:00Z' } })).rejects.toThrow('must be earlier');
    await expect(call({ fn: listPosts.run, propsValue: { organizationId: ORG, status: ['pending'] } })).rejects.toThrow('"pending"');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('list_posts: omits filter when none is given and reports the next cursor', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { posts: { edges: null, pageInfo: { endCursor: 'n', hasNextPage: true } } } }));
    const result = await call({ fn: listPosts.run, propsValue: { organizationId: ORG } });
    expect(variablesOf({ index: 0 })).toEqual({ input: { organizationId: ORG, sort: [{ field: 'createdAt', direction: 'desc' }] }, first: 20, withMetrics: false });
    expect(result).toEqual({ posts: [], nextCursor: 'n', hasNextPage: true });
  });

  it('list_ideas: Include Untagged without Tag IDs is refused', async () => {
    await expect(call({ fn: listIdeas.run, propsValue: { organizationId: ORG, includeUntagged: 'yes' } })).rejects.toThrow('only works together with Tag IDs');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_post_metrics: refuses a missing or inverted window before calling Buffer', async () => {
    await expect(call({ fn: getPostMetrics.run, propsValue: { organizationId: ORG, startDateTime: '2026-10-01T00:00:00Z' } })).rejects.toThrow('From and To are both required');
    await expect(call({ fn: getPostMetrics.run, propsValue: { organizationId: ORG, startDateTime: '2026-10-02T00:00:00Z', endDateTime: '2026-10-01T00:00:00Z' } })).rejects.toThrow('From must be earlier than To');
    await expect(call({ fn: getPostMetrics.run, propsValue: { organizationId: ORG, startDateTime: 'last month', endDateTime: '2026-10-01T00:00:00Z' } })).rejects.toThrow('not a valid ISO 8601');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('create_idea: refuses only-blank content before calling Buffer, trims the group id, and fails on a typed error', async () => {
    await expect(call({ fn: createIdea.run, propsValue: { organizationId: ORG, imageUrls: [' ', ''] } })).rejects.toThrow('at least a title, text, or one image');
    expect(sendRequest).not.toHaveBeenCalled();
    sendRequest.mockResolvedValueOnce(ok({ data: { createIdea: { __typename: 'LimitReachedError', message: 'Idea limit reached' } } }));
    await expect(call({ fn: createIdea.run, propsValue: { organizationId: ORG, groupId: ' g1 ', title: 'T', imageUrls: [' https://i.io/a.png '], aiAssisted: false } })).rejects.toThrow('Buffer rejected the idea: Idea limit reached');
    expect(variablesOf({ index: 0 }).input).toEqual({ organizationId: ORG, content: { title: 'T', media: [{ url: 'https://i.io/a.png', type: 'image' }] }, group: { groupId: 'g1' } });
  });

  it('create_idea: returns the wrapped createIdea output unchanged', async () => {
    const payload = { createIdea: { __typename: 'IdeaResponse', idea: { id: 'i1', organizationId: ORG }, refreshIdeas: false } };
    sendRequest.mockResolvedValueOnce(ok({ data: payload }));
    await expect(call({ fn: createIdea.run, propsValue: { organizationId: ORG, text: 'x' } })).resolves.toEqual(payload);
  });

  it('create_idea: selects both success members of the createIdea union', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createIdea: { __typename: 'IdeaResponse', idea: { id: 'i1' }, refreshIdeas: false } } }));
    await call({ fn: createIdea.run, propsValue: { organizationId: ORG, text: 'x' } });
    const query = queryOf({ index: 0 }).replace(/\s+/g, ' ');
    expect(query).toMatch(/\.\.\. on Idea \{ id organizationId groupId createdAt updatedAt content \{/);
    expect(query).toMatch(/\.\.\. on IdeaResponse \{ idea \{ id organizationId groupId createdAt updatedAt content \{/);
    expect(query).toContain('... on MutationError { message }');
  });

  it('create_idea: wraps a bare Idea result into the IdeaResponse shape', async () => {
    const idea = {
      id: '6af2c54e301c7bc603c54abf',
      organizationId: ORG,
      groupId: 'g1',
      createdAt: 1762776000,
      updatedAt: 1762776000,
      content: { title: 'ap-live-test idea', text: null, media: [], tags: [] },
    };
    sendRequest.mockResolvedValueOnce(ok({ data: { createIdea: { __typename: 'Idea', ...idea } } }));
    await expect(call({ fn: createIdea.run, propsValue: { organizationId: ORG, groupId: 'g1', title: 'ap-live-test idea' } })).resolves.toEqual({
      createIdea: { __typename: 'IdeaResponse', idea, refreshIdeas: false },
    });
  });

  it('create_idea: an InvalidInputError still fails the step', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createIdea: { __typename: 'InvalidInputError', message: 'Organization not found' } } }));
    await expect(call({ fn: createIdea.run, propsValue: { organizationId: 'bad', text: 'x' } })).rejects.toThrow('Buffer rejected the idea: Organization not found');
  });

  it('delete_post: a NOT_FOUND with null data fails the step', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { data: null, errors: [{ message: 'Post not found', extensions: { code: 'NOT_FOUND' } }] } });
    await expect(call({ fn: deletePost.run, propsValue: { postId: 'p1' } })).rejects.toThrow('(HTTP 200 NOT_FOUND): Post not found');
  });
});

describe('QA round 3: edit_post fill and create_post YouTube check', () => {
  it('edit_post: local refusals still make no request now that the post is read first', async () => {
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p1', dueAt: '2026-11-01T09:00:00Z' } })).rejects.toThrow('not in the future');
    await expect(call({ fn: editPost.run, propsValue: { postId: 'p1', metadata: '[1]' } })).rejects.toThrow();
    await expect(call({ fn: editPost.run, propsValue: { postId: ' ' , text: 'x' } })).rejects.toThrow();
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('edit_post: caller text on a text-less media post wins and the stored media is not resent', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { id: 'p2', text: '', channelService: 'instagram', metadata: null, assets: [{ type: 'image', source: 'https://cdn.io/a.png', thumbnail: null, image: null }] } }))
      .mockResolvedValueOnce(edited({ id: 'p2' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p2', text: 'caption' } });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p2', text: 'caption' });
  });

  it('edit_post: caller Image URLs and Clear Media on a text-less post are not overwritten by the stored media', async () => {
    const textless = { id: 'p3', text: null, channelService: 'instagram', metadata: null, assets: [{ type: 'image', source: 'https://cdn.io/old.png', thumbnail: null, image: null }] };
    sendRequest.mockResolvedValueOnce(stored({ post: textless })).mockResolvedValueOnce(edited({ id: 'p3' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p3', imageUrls: ['https://i.io/new.png'] } });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p3', assets: [{ image: { url: 'https://i.io/new.png' } }] });
    sendRequest.mockReset();
    sendRequest.mockResolvedValueOnce(stored({ post: textless })).mockResolvedValueOnce(edited({ id: 'p3' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p3', clearMedia: 'yes' } });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p3', assets: [] });
  });

  it('edit_post: sends no assets when one stored asset cannot be rebuilt, so Buffer reports instead of losing media', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({
        post: {
          id: 'p4', text: '', channelService: 'linkedin', metadata: null,
          assets: [
            { type: 'image', source: 'https://cdn.io/a.png', thumbnail: null, image: null },
            { type: 'document', source: 'https://cdn.io/d.pdf', thumbnail: null, document: { title: 'Deck' } },
          ],
        },
      }))
      .mockResolvedValueOnce(edited({ id: 'p4' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p4', dueAt: '2026-12-30T10:30:00Z' } });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'p4', dueAt: '2026-12-30T10:30:00.000Z', mode: 'customScheduled' });
  });

  it('edit_post: a document with title and thumbnail is rebuilt with url, title and thumbnailUrl, and a video never gets thumbnailUrl', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({
        post: {
          id: 'p5', text: ' ', channelService: 'linkedin', metadata: null,
          assets: [
            { type: 'document', source: 'https://cdn.io/d.pdf', thumbnail: 'https://cdn.io/d.png', document: { title: 'Deck' } },
            { type: 'video', source: 'https://cdn.io/v.mp4', thumbnail: 'https://cdn.io/v.png', video: null },
          ],
        },
      }))
      .mockResolvedValueOnce(edited({ id: 'p5' }));
    await call({ fn: editPost.run, propsValue: { postId: 'p5', schedulingType: 'notification' } });
    expect(variablesOf({ index: 1 }).input).toEqual({
      id: 'p5',
      schedulingType: 'notification',
      assets: [
        { document: { url: 'https://cdn.io/d.pdf', title: 'Deck', thumbnailUrl: 'https://cdn.io/d.png' } },
        { video: { url: 'https://cdn.io/v.mp4' } },
      ],
    });
  });

  it('edit_post: a YouTube post keeps other caller service objects next to the merged youtube object', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: LIVE_YOUTUBE_POST }))
      .mockResolvedValueOnce(edited({ id: LIVE_YOUTUBE_POST.id }));
    await call({ fn: editPost.run, propsValue: { postId: LIVE_YOUTUBE_POST.id, metadata: { youtube: { privacy: 'unlisted' }, linkedin: { firstComment: 'c' } } } });
    expect(variablesOf({ index: 1 }).input.metadata).toEqual({
      linkedin: { firstComment: 'c' },
      youtube: {
        title: 'ap-live-test', privacy: 'unlisted', license: 'youtube', madeForKids: false, notifySubscribers: true, embeddable: true,
        isAiGenerated: false, categoryId: '22',
      },
    });
  });

  it('edit_post: a YouTube post with no stored settings and no caller youtube sends no metadata', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { id: 'y1', text: 'old', channelService: 'youtube', assets: [], metadata: null } }))
      .mockResolvedValueOnce(edited({ id: 'y1' }));
    await call({ fn: editPost.run, propsValue: { postId: 'y1', dueAt: '2026-12-30T10:30:00Z' } });
    expect(variablesOf({ index: 1 }).input).toEqual({ id: 'y1', text: 'old', dueAt: '2026-12-30T10:30:00.000Z', mode: 'customScheduled' });
  });

  it('edit_post: a non-YouTube post never gets stored metadata, only the caller object unchanged', async () => {
    sendRequest
      .mockResolvedValueOnce(stored({ post: { ...LIVE_YOUTUBE_POST, id: 'b1', channelService: 'bluesky' } }))
      .mockResolvedValueOnce(edited({ id: 'b1' }));
    await call({ fn: editPost.run, propsValue: { postId: 'b1', metadata: { bluesky: { linkAttachment: { url: 'https://a.io' } } } } });
    expect(variablesOf({ index: 1 }).input.metadata).toEqual({ bluesky: { linkAttachment: { url: 'https://a.io' } } });
  });

  it('create_post: a blank YouTube title is refused like a missing one, and the category alone is not enough', async () => {
    sendRequest.mockResolvedValue(ok({ data: { channels: [{ id: LIVE_YOUTUBE, name: 'Odai Thalji', service: 'youtube' }] } }));
    await expect(call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: [LIVE_YOUTUBE], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic', youtubeTitle: '   ', youtubeCategoryId: '22' } }))
      .rejects.toThrow('Nothing was created.');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('create_post: a vendor reason that already ends with a full stop is not given a second one', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { channels: [{ id: 'c1', name: 'A', service: 'mastodon' }, { id: 'c2', name: 'B', service: 'mastodon' }] } }))
      .mockResolvedValueOnce(created({ id: 'p1', channelId: 'c1' }))
      .mockResolvedValueOnce(ok({ data: { createPost: { __typename: 'LimitReachedError', message: 'Queue is full.' } } }));
    await expect(call({ fn: createPost.run, propsValue: { organizationId: ORG, channelIds: ['c1', 'c2'], text: 'hi', mode: 'addToQueue', schedulingType: 'automatic' } }))
      .rejects.toThrow(/Queue is full\. These posts were already created/);
  });

  it('create_post: keeps the legacy output shape and selection, without the new metadata group', async () => {
    expect(bufferQueries.CREATE_POST_LEGACY).toContain('post { id text status dueAt sentAt channelId }');
    expect(bufferQueries.CREATE_POST_LEGACY).not.toContain('metadata');
    expect(createPost.props.youtubeTitle.required).toBe(false);
    expect(createPost.props.youtubeCategoryId.required).toBe(false);
  });
});
