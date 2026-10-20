import { afterEach, describe, expect, it, vi } from 'vitest';
import { bettermode } from '../src';
import { clearSessionCache } from '../src/lib/common/client';
import { getCurrentMemberAction, getNetworkAction } from '../src/lib/actions/ai/account';
import {
  assignBadgeToMemberAction,
  listBadgesAction,
  listEventsAction,
  listModerationItemsAction,
  registerForEventAction,
  revokeBadgeFromMemberAction,
} from '../src/lib/actions/ai/community';
import {
  deleteMemberAction,
  findMemberByEmailAction,
  getMemberAction,
  inviteMembersAction,
  listMembersAction,
  sendDirectMessageAction,
  suspendMemberAction,
  unsuspendMemberAction,
  updateMemberAction,
} from '../src/lib/actions/ai/members';
import {
  addReactionAction,
  createPostAction,
  createReplyAction,
  deletePostAction,
  getPostAction,
  hidePostAction,
  listPostsAction,
  listPostTypesAction,
  listRepliesAction,
  listTagsAction,
  movePostAction,
  pinPostAction,
  removeReactionAction,
  searchPostsAction,
  unhidePostAction,
  unpinPostAction,
  updatePostAction,
} from '../src/lib/actions/ai/posts';
import {
  addMemberToSpaceAction,
  getSpaceAction,
  listSpaceMembersAction,
  listSpacesAction,
  removeMemberFromSpaceAction,
} from '../src/lib/actions/ai/spaces';
import { assignBadgeAction } from '../src/lib/actions/assign-badge';
import { createDiscussionAction } from '../src/lib/actions/create-discussion';
import { createQuestionAction } from '../src/lib/actions/create-question';
import { revokeBadgeAction } from '../src/lib/actions/revoke-badge';
import { businessCalls, call, makeContext, MEMBER_TOKEN, pageOf, stubGraphql } from './helpers';

afterEach(() => {
  clearSessionCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const POST_NODE = {
  id: 'post1',
  title: 'Hello',
  slug: 'hello-post1',
  url: 'https://community.example.com/p/hello-post1',
  status: 'PUBLISHED',
  spaceId: 'space1',
  space: { name: 'General' },
  postTypeId: 'type1',
  postType: { name: 'Discussion' },
  ownerId: 'm1',
  owner: { member: { name: 'Ann' } },
  repliedToId: null,
  textContent: 'Body',
  shortContent: '<p>Body</p>',
  fields: [
    { key: 'title', value: '"Hello"' },
    { key: 'content', value: '"<p>Body</p>"' },
  ],
  tags: [
    { id: 't1', title: 'news' },
    { id: 't2', title: 'intro' },
  ],
  repliesCount: 2,
  reactionsCount: 4,
  locked: false,
  isHidden: false,
  createdAt: '2026-10-13T10:00:00.000Z',
  updatedAt: '2026-10-13T10:05:00.000Z',
  publishedAt: '2026-10-13T10:00:00.000Z',
};

const POST_OUT = {
  id: 'post1',
  title: 'Hello',
  url: 'https://community.example.com/p/hello-post1',
  space_id: 'space1',
  space_name: 'General',
  post_type_name: 'Discussion',
  owner_name: 'Ann',
  content_html: '<p>Body</p>',
  tags: 'news, intro',
  tag_ids: 't1, t2',
  replies_count: 2,
  created_at: '2026-10-13T10:00:00.000Z',
};

const MEMBER_NODE = {
  id: 'm1',
  name: 'Ann',
  email: 'ann@example.com',
  username: 'ann',
  tagline: null,
  status: 'VERIFIED',
  url: 'https://community.example.com/member/m1',
  createdAt: '2026-10-01T00:00:00.000Z',
  role: { id: 'r1', name: 'Admin' },
};

const MEMBER_OUT = { id: 'm1', name: 'Ann', email: 'ann@example.com', role_name: 'Admin', tagline: null };

const SPACE_NODE = {
  id: 'space1',
  name: 'General',
  slug: 'general',
  url: 'https://community.example.com/general',
  description: null,
  type: 'Group',
  private: false,
  hidden: false,
  membersCount: 10,
  postsCount: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const OK = { status: 'succeeded' };

type Case = {
  name: string;
  action: unknown;
  props: Record<string, unknown>;
  operation: string;
  variables: Record<string, unknown>;
  data: Record<string, unknown>;
  output: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

const CASES: Case[] = [
  {
    name: 'get_current_member',
    action: getCurrentMemberAction,
    props: {},
    operation: 'GetCurrentMember',
    variables: {},
    data: { authMember: MEMBER_NODE },
    output: MEMBER_OUT,
  },
  {
    name: 'get_network',
    action: getNetworkAction,
    props: {},
    operation: 'GetNetwork',
    variables: {},
    data: { network: { id: 'n1', name: 'Acme', domain: 'community.example.com', planName: 'Pro', membersCount: 50 } },
    output: { id: 'n1', name: 'Acme', plan_name: 'Pro', members_count: 50 },
  },
  {
    name: 'list_spaces',
    action: listSpacesAction,
    props: { query: 'gen', limit: 10, cursor: 'c1', member_id: 'm1' },
    operation: 'ListSpaces',
    variables: { limit: 10, after: 'c1', query: 'gen', memberId: 'm1' },
    data: { spaces: pageOf({ nodes: [SPACE_NODE], hasNextPage: true, endCursor: 'c2' }) },
    output: { items: [{ id: 'space1', name: 'General', members_count: 10 }], next_cursor: 'c2', has_more: true },
  },
  {
    name: 'get_space',
    action: getSpaceAction,
    props: { slug: 'general' },
    operation: 'GetSpace',
    variables: { slug: 'general' },
    data: { space: SPACE_NODE },
    output: { id: 'space1', slug: 'general' },
  },
  {
    name: 'list_space_members',
    action: listSpaceMembersAction,
    props: { space_id: 'space1' },
    operation: 'ListSpaceMembers',
    variables: { spaceId: 'space1', limit: 20, after: null },
    data: { spaceMembers: pageOf([{ member: MEMBER_NODE, role: { id: 'sr1', name: 'Member' } }]) },
    output: { items: [{ member_id: 'm1', member_name: 'Ann', role_name: 'Member' }], next_cursor: null, has_more: false },
  },
  {
    name: 'add_member_to_space',
    action: addMemberToSpaceAction,
    props: { space_id: 'space1', member_ids: ['m1', 'm2'], role_id: 'sr1' },
    operation: 'AddSpaceMembers',
    variables: {
      spaceId: 'space1',
      input: [
        { memberId: 'm1', roleId: 'sr1' },
        { memberId: 'm2', roleId: 'sr1' },
      ],
    },
    data: { addSpaceMembers: [{ member: MEMBER_NODE, role: { id: 'sr1', name: 'Member' } }] },
    output: { space_id: 'space1', member_ids: 'm1, m2', items: [{ member_id: 'm1' }] },
  },
  {
    name: 'remove_member_from_space',
    action: removeMemberFromSpaceAction,
    props: { space_id: 'space1', member_ids: ['m1'] },
    operation: 'RemoveSpaceMembers',
    variables: { spaceId: 'space1', memberIds: ['m1'] },
    data: { removeSpaceMembers: [OK] },
    output: { success: true, space_id: 'space1', member_ids: 'm1' },
  },
  {
    name: 'list_post_types',
    action: listPostTypesAction,
    props: { context: 'reply' },
    operation: 'ListPostTypes',
    variables: { limit: 20, after: null, context: 'reply' },
    data: { postTypes: pageOf([{ id: 'c1', name: 'Comment', pluralName: 'Comments', slug: 'comment', context: 'reply', archived: false }]) },
    output: { items: [{ id: 'c1', name: 'Comment', context: 'reply' }] },
  },
  {
    name: 'list_posts',
    action: listPostsAction,
    props: { space_ids: ['space1'], post_type_ids: [], order_by: 'lastActivityAt', reverse: true },
    operation: 'ListPosts',
    variables: { limit: 20, after: null, spaceIds: ['space1'], orderBy: 'lastActivityAt', reverse: true },
    data: { posts: pageOf([POST_NODE]) },
    output: { items: [POST_OUT] },
  },
  {
    name: 'search_posts',
    action: searchPostsAction,
    props: { query: 'hello' },
    operation: 'SearchPosts',
    variables: { query: 'hello', limit: 20, after: null },
    data: { searchPosts: pageOf([POST_NODE]) },
    output: { items: [POST_OUT] },
  },
  {
    name: 'get_post',
    action: getPostAction,
    props: { post_id: 'post1' },
    operation: 'GetPost',
    variables: { id: 'post1' },
    data: { post: POST_NODE },
    output: POST_OUT,
  },
  {
    name: 'create_post',
    action: createPostAction,
    props: { space_id: 'space1', post_type_id: 'type1', title: 'Hello "x"', content: '<p>Body</p>', tag_names: ['news', ' ', 'intro'], locked: true },
    operation: 'CreatePost',
    variables: {
      spaceId: 'space1',
      input: {
        postTypeId: 'type1',
        mappingFields: [
          { key: 'title', type: 'text', value: '"Hello \\"x\\""' },
          { key: 'content', type: 'html', value: '"<p>Body</p>"' },
        ],
        tagNames: ['news', 'intro'],
        locked: true,
      },
    },
    data: { createPost: POST_NODE },
    output: POST_OUT,
  },
  {
    name: 'update_post',
    action: updatePostAction,
    props: { post_id: 'post1', title: 'New', clear_tags: true, lock: 'unlock' },
    operation: 'UpdatePost',
    variables: {
      id: 'post1',
      input: { mappingFields: [{ key: 'title', type: 'text', value: '"New"' }], tagNames: [], locked: false },
    },
    data: { updatePost: POST_NODE },
    output: POST_OUT,
  },
  {
    name: 'delete_post',
    action: deletePostAction,
    props: { post_id: 'post1' },
    operation: 'DeletePost',
    variables: { id: 'post1' },
    data: { deletePost: OK },
    output: { id: 'post1', deleted: true, status: 'succeeded' },
  },
  {
    name: 'list_replies',
    action: listRepliesAction,
    props: { post_id: 'post1', limit: '5', cursor: 'c9' },
    operation: 'ListReplies',
    variables: { postId: 'post1', limit: 5, after: 'c9' },
    data: { replies: pageOf([{ ...POST_NODE, id: 'r1', repliedToId: 'post1' }]) },
    output: { items: [{ id: 'r1', replied_to_id: 'post1' }] },
  },
  {
    name: 'create_reply',
    action: createReplyAction,
    props: { post_id: 'post1', content: '<p>Hi</p>', reply_post_type_id: 'c1' },
    operation: 'CreateReply',
    variables: { postId: 'post1', input: { postTypeId: 'c1', mappingFields: [{ key: 'content', type: 'html', value: '"<p>Hi</p>"' }] } },
    data: { createReply: { ...POST_NODE, id: 'r1', repliedToId: 'post1' } },
    output: { id: 'r1', replied_to_id: 'post1' },
  },
  {
    name: 'add_reaction',
    action: addReactionAction,
    props: { post_id: 'post1', reaction: '+1' },
    operation: 'AddReaction',
    variables: { postId: 'post1', input: { reaction: '+1' } },
    data: { addReaction: OK },
    output: { success: true, post_id: 'post1', reaction: '+1' },
  },
  {
    name: 'remove_reaction',
    action: removeReactionAction,
    props: { post_id: 'post1', reaction: '+1' },
    operation: 'RemoveReaction',
    variables: { postId: 'post1', reaction: '+1' },
    data: { removeReaction: OK },
    output: { success: true, post_id: 'post1' },
  },
  {
    name: 'pin_post',
    action: pinPostAction,
    props: { post_id: 'post1' },
    operation: 'PinPost',
    variables: { postId: 'post1' },
    data: { pinPostToSpace: OK },
    output: { success: true, post_id: 'post1' },
  },
  {
    name: 'unpin_post',
    action: unpinPostAction,
    props: { post_id: 'post1' },
    operation: 'UnpinPost',
    variables: { postId: 'post1' },
    data: { unpinPostFromSpace: OK },
    output: { success: true },
  },
  {
    name: 'hide_post',
    action: hidePostAction,
    props: { post_id: 'post1' },
    operation: 'HidePost',
    variables: { id: 'post1' },
    data: { hidePost: OK },
    output: { success: true },
  },
  {
    name: 'unhide_post',
    action: unhidePostAction,
    props: { post_id: 'post1' },
    operation: 'UnhidePost',
    variables: { id: 'post1' },
    data: { unhidePost: OK },
    output: { success: true },
  },
  {
    name: 'move_post',
    action: movePostAction,
    props: { post_id: 'post1', space_id: 'space2' },
    operation: 'MovePost',
    variables: { id: 'post1', spaceId: 'space2' },
    data: { movePost: { ...POST_NODE, spaceId: 'space2' } },
    output: { id: 'post1', space_id: 'space2' },
  },
  {
    name: 'list_tags',
    action: listTagsAction,
    props: { space_id: 'space1', query: 'ne' },
    operation: 'ListTags',
    variables: { limit: 20, after: null, spaceId: 'space1', query: 'ne' },
    data: { tags: pageOf([{ id: 't1', title: 'news', slug: 'news', description: null }]) },
    output: { items: [{ id: 't1', title: 'news' }] },
  },
  {
    name: 'find_member_by_email',
    action: findMemberByEmailAction,
    props: { email: 'Ann@Example.com' },
    operation: 'FindMembers',
    variables: { query: 'Ann@Example.com', limit: 50, after: null },
    data: { members: pageOf([{ ...MEMBER_NODE, id: 'm9', email: 'joann@example.com' }, MEMBER_NODE]) },
    output: { found: true, member: MEMBER_OUT },
  },
  {
    name: 'get_member',
    action: getMemberAction,
    props: { username: 'ann' },
    operation: 'GetMember',
    variables: { username: 'ann' },
    data: { member: MEMBER_NODE },
    output: MEMBER_OUT,
  },
  {
    name: 'list_members',
    action: listMembersAction,
    props: { status: ['VERIFIED'], query: 'an' },
    operation: 'ListMembers',
    variables: { limit: 20, after: null, query: 'an', status: ['VERIFIED'] },
    data: { members: pageOf([MEMBER_NODE]) },
    output: { items: [MEMBER_OUT] },
  },
  {
    name: 'update_member',
    action: updateMemberAction,
    props: { member_id: 'm1', name: 'Ann B', clear_tagline: true },
    operation: 'UpdateMember',
    variables: { id: 'm1', input: { name: 'Ann B', tagline: '' } },
    data: { updateMember: MEMBER_NODE },
    output: MEMBER_OUT,
  },
  {
    name: 'invite_members',
    action: inviteMembersAction,
    props: { emails: ['a@example.com', 'b@example.com'], invitation_message: 'Join us' },
    operation: 'InviteMembers',
    variables: { input: { invitees: [{ email: 'a@example.com' }, { email: 'b@example.com' }], invitationMessage: 'Join us' } },
    data: { inviteMembers: [{ id: 'i1', inviteeEmail: 'a@example.com', status: 'PENDING' }] },
    output: { count: 1, items: [{ id: 'i1', invitee_email: 'a@example.com' }] },
  },
  {
    name: 'suspend_member',
    action: suspendMemberAction,
    props: { member_id: 'm1' },
    operation: 'SuspendMember',
    variables: { memberId: 'm1' },
    data: { suspendMember: OK },
    output: { success: true, member_id: 'm1' },
  },
  {
    name: 'unsuspend_member',
    action: unsuspendMemberAction,
    props: { member_id: 'm1' },
    operation: 'UnsuspendMember',
    variables: { memberId: 'm1' },
    data: { unsuspendMember: OK },
    output: { success: true, member_id: 'm1' },
  },
  {
    name: 'delete_member',
    action: deleteMemberAction,
    props: { member_id: 'm1' },
    operation: 'DeleteMember',
    variables: { id: 'm1' },
    data: { deleteMember: OK },
    output: { id: 'm1', deleted: true },
  },
  {
    name: 'send_direct_message',
    action: sendDirectMessageAction,
    props: { recipient_id: 'm2', content: 'Hello' },
    operation: 'SendMessage',
    variables: { input: { recipientId: 'm2', message: { content: 'Hello' } } },
    data: { sendMessageToMember: { chatId: 'chat1', message: { _id: 'msg1', content: 'Hello', sentAt: '2026-10-13T00:00:00.000Z' } } },
    output: { message_id: 'msg1', chat_id: 'chat1', recipient_id: 'm2' },
  },
  {
    name: 'list_badges',
    action: listBadgesAction,
    props: {},
    operation: 'ListBadges',
    variables: {},
    data: { network: { badges: [{ id: 'b1', name: 'Helper', shortDescription: 'Helps', type: 'Custom', active: true }] } },
    output: { count: 1, items: [{ id: 'b1', name: 'Helper' }] },
  },
  {
    name: 'assign_badge_to_member',
    action: assignBadgeToMemberAction,
    props: { badge_id: 'b1', member_id: 'm1' },
    operation: 'AssignBadge',
    variables: { badgeId: 'b1', input: { memberId: 'm1' } },
    data: { assignBadge: OK },
    output: { success: true, badge_id: 'b1', member_id: 'm1' },
  },
  {
    name: 'revoke_badge_from_member',
    action: revokeBadgeFromMemberAction,
    props: { badge_id: 'b1', member_id: 'm1' },
    operation: 'RevokeBadge',
    variables: { badgeId: 'b1', input: { memberId: 'm1' } },
    data: { revokeBadge: OK },
    output: { success: true },
  },
  {
    name: 'list_events',
    action: listEventsAction,
    props: { space_ids: 'space1, space2', status: 'published' },
    operation: 'ListEvents',
    variables: { limit: 20, after: null, spaceIds: ['space1', 'space2'], status: 'published' },
    data: { events: pageOf([{ id: 'e1', title: 'Meetup', startTime: '2026-11-01T10:00:00.000Z', registrationsCount: 3 }]) },
    output: { items: [{ id: 'e1', title: 'Meetup', registrations_count: 3 }] },
  },
  {
    name: 'register_member_for_event',
    action: registerForEventAction,
    props: { event_id: 'e1' },
    operation: 'RegisterForEvent',
    variables: { eventId: 'e1' },
    data: { registerForEvent: OK },
    output: { success: true, event_id: 'e1' },
  },
  {
    name: 'list_moderation_items',
    action: listModerationItemsAction,
    props: { status: 'REVIEW' },
    operation: 'ListModerationItems',
    variables: { limit: 20, after: null, status: 'REVIEW' },
    data: { moderationItems: pageOf([{ id: 'mod1', status: 'REVIEW', flaggedBy: 'MEMBER' }]) },
    output: { items: [{ id: 'mod1', status: 'REVIEW', flagged_by: 'MEMBER' }] },
  },
];

describe('ai actions send the exact GraphQL request', () => {
  it.each(CASES)('$name', async ({ action, props, operation, variables, data, output }) => {
    const calls = stubGraphql({ [operation]: data });
    const result = await call({ fn: Reflect.get(Object(action), 'run'), ctx: makeContext({ props }) });
    const sent = businessCalls(calls);
    expect(sent).toHaveLength(1);
    expect(sent[0].operation).toBe(operation);
    expect(sent[0].variables).toEqual(variables);
    expect(sent[0].url).toBe('https://api.bettermode.com/');
    expect(sent[0].headers['authorization']).toBe(`Bearer ${MEMBER_TOKEN}`);
    expect(sent[0].redirect).toBe('manual');
    expect(result).toMatchObject(output);
  });

  it('covers every ai action of the piece', () => {
    const aiNames = Object.values(bettermode.actions())
      .filter((action) => action.audience === 'ai')
      .map((action) => action.name)
      .sort();
    expect(aiNames).toEqual(CASES.map((item) => item.name).sort());
  });

  it.each(CASES)('$name keeps input values out of the query text', async ({ action, props, operation, data }) => {
    const calls = stubGraphql({ [operation]: data });
    await call({ fn: Reflect.get(Object(action), 'run'), ctx: makeContext({ props }) });
    const query = businessCalls(calls)[0].query;
    const values = Object.values(props).flatMap((value) => (Array.isArray(value) ? value : [value]));
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length >= 4) {
        expect(query).not.toContain(value.trim());
      }
    }
  });
});

describe('publishing', () => {
  it('publishes a post that Bettermode created as a draft', async () => {
    const calls = stubGraphql({
      CreatePost: { createPost: { ...POST_NODE, status: 'DRAFT' } },
      PublishPost: { publishPost: POST_NODE },
    });
    const result = await call({
      fn: createPostAction.run,
      ctx: makeContext({ props: { space_id: 's', post_type_id: 'pt', title: 'T', content: 'C' } }),
    });
    const publish = businessCalls(calls).find((item) => item.operation === 'PublishPost');
    expect(publish?.variables).toEqual({ postId: POST_NODE.id });
    expect(result).toMatchObject({ status: 'PUBLISHED' });
  });

  it('publishes a reply that Bettermode created as a draft', async () => {
    const calls = stubGraphql({
      CreateReply: { createReply: { ...POST_NODE, status: 'DRAFT' } },
      PublishPost: { publishPost: POST_NODE },
    });
    await call({
      fn: createReplyAction.run,
      ctx: makeContext({ props: { post_id: 'parent', content: 'C', reply_post_type_id: 'rt' } }),
    });
    expect(businessCalls(calls).some((item) => item.operation === 'PublishPost')).toBe(true);
  });

  it('does not publish again when the post is already published', async () => {
    const calls = stubGraphql({ CreatePost: { createPost: POST_NODE } });
    await call({
      fn: createPostAction.run,
      ctx: makeContext({ props: { space_id: 's', post_type_id: 'pt', title: 'T', content: 'C' } }),
    });
    expect(calls.some((item) => item.operation === 'PublishPost')).toBe(false);
  });
});

describe('human actions', () => {
  const postTypes = {
    postTypes: pageOf([
      { id: 'pt-board', name: 'Discussion Board' },
      { id: 'pt-disc', name: 'Discussion' },
      { id: 'pt-q', name: 'Question' },
    ]),
  };

  const noSpaceTypes = { space: { authMemberProps: { availablePostTypes: null } } };

  it('create_discussion matches the post type name exactly and omits empty tags', async () => {
    const calls = stubGraphql({ GetSpacePostTypes: noSpaceTypes, ListPostTypes: postTypes, CreatePost: { createPost: POST_NODE } });
    const result = await call({
      fn: createDiscussionAction.run,
      ctx: makeContext({ props: { spaceId: 'space1', title: 'T', content: 'C', tagNames: '', locked: false } }),
    });
    const create = businessCalls(calls).find((item) => item.operation === 'CreatePost');
    expect(create?.variables).toEqual({
      spaceId: 'space1',
      input: {
        postTypeId: 'pt-disc',
        mappingFields: [
          { key: 'title', type: 'text', value: '"T"' },
          { key: 'content', type: 'html', value: '"C"' },
        ],
        locked: false,
      },
    });
    expect(result).toMatchObject({ ...POST_OUT, createdAt: POST_NODE.createdAt });
  });

  it('create_question uses the Question type and splits comma tags', async () => {
    const calls = stubGraphql({ GetSpacePostTypes: noSpaceTypes, ListPostTypes: postTypes, CreatePost: { createPost: POST_NODE } });
    await call({
      fn: createQuestionAction.run,
      ctx: makeContext({ props: { spaceId: 'space1', title: 'T', content: 'C', tagNames: 'a, ,b,' } }),
    });
    const create = businessCalls(calls).find((item) => item.operation === 'CreatePost');
    expect(create?.variables['input']).toMatchObject({ postTypeId: 'pt-q', tagNames: ['a', 'b'] });
  });

  it('fails clearly when the post type does not exist instead of crashing', async () => {
    stubGraphql({ GetSpacePostTypes: noSpaceTypes, ListPostTypes: { postTypes: pageOf([{ id: 'x', name: 'Article' }]) } });
    await expect(
      call({ fn: createQuestionAction.run, ctx: makeContext({ props: { spaceId: 's', title: 'T', content: 'C' } }) })
    ).rejects.toThrow('No post type named "Question" exists in this community. Available post types: Article.');
  });

  it('create_discussion picks the Discussion type available in the space when names repeat', async () => {
    const calls = stubGraphql({
      GetSpacePostTypes: {
        space: { authMemberProps: { availablePostTypes: [{ id: 'pt-space-disc', name: 'Discussion', context: 'post' }] } },
      },
      CreatePost: { createPost: POST_NODE },
    });
    await call({ fn: createDiscussionAction.run, ctx: makeContext({ props: { spaceId: 'space1', title: 'T', content: 'C' } }) });
    expect(calls.some((item) => item.operation === 'ListPostTypes')).toBe(false);
    const create = businessCalls(calls).find((item) => item.operation === 'CreatePost');
    expect(create?.variables['input']).toMatchObject({ postTypeId: 'pt-space-disc' });
  });

  it('names the post types the space allows when the wanted type is not available there', async () => {
    stubGraphql({
      GetSpacePostTypes: { space: { authMemberProps: { availablePostTypes: [{ id: 'a', name: 'Article', context: 'post' }] } } },
    });
    await expect(
      call({ fn: createQuestionAction.run, ctx: makeContext({ props: { spaceId: 's', title: 'T', content: 'C' } }) })
    ).rejects.toThrow('No post type named "Question" is available in this space. Available post types: Article.');
  });

  it('assign_badge resolves the exact email, not the first fuzzy hit', async () => {
    const calls = stubGraphql({
      FindMembers: { members: pageOf([{ ...MEMBER_NODE, id: 'wrong', email: 'joann@example.com' }, MEMBER_NODE]) },
      AssignBadge: { assignBadge: OK },
    });
    const result = await call({
      fn: assignBadgeAction.run,
      ctx: makeContext({ props: { badgeId: 'b1', email: 'ANN@example.com' } }),
    });
    expect(businessCalls(calls).find((item) => item.operation === 'AssignBadge')?.variables).toEqual({
      badgeId: 'b1',
      input: { memberId: 'm1' },
    });
    expect(result).toEqual({
      success: true,
      status: 'succeeded',
      badge_id: 'b1',
      member_id: 'm1',
      member_name: 'Ann',
      member_email: 'ann@example.com',
    });
  });

  it('revoke_badge fails when only partial email matches exist', async () => {
    const calls = stubGraphql({ FindMembers: { members: pageOf([{ ...MEMBER_NODE, email: 'joann@example.com' }]) } });
    await expect(
      call({ fn: revokeBadgeAction.run, ctx: makeContext({ props: { badgeId: 'b1', email: 'ann@example.com' } }) })
    ).rejects.toThrow('No member with email ann@example.com was found');
    expect(businessCalls(calls).some((item) => item.operation === 'RevokeBadge')).toBe(false);
  });
});
