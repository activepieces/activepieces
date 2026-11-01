import { afterEach, describe, expect, it, vi } from 'vitest';
import { discourse } from '../src';
import { addUsersToGroup } from '../src/lib/actions/add-users-to-group.action';
import { changeUserTrustLevel } from '../src/lib/actions/change-trust-level.action';
import { createPost } from '../src/lib/actions/create-post.action';
import { createTopic } from '../src/lib/actions/create-topic.action';
import { sendPrivateMessage } from '../src/lib/actions/send-private-message.action';
import { activateUserAction } from '../src/lib/actions/ai/activate-user';
import { addGroupMembersAction } from '../src/lib/actions/ai/add-group-members';
import { adminGetUserAction } from '../src/lib/actions/ai/admin-get-user';
import { createCategoryAction } from '../src/lib/actions/ai/create-category';
import { createGroupAction } from '../src/lib/actions/ai/create-group';
import { createInviteAction } from '../src/lib/actions/ai/create-invite';
import { createTopicAiAction } from '../src/lib/actions/ai/create-topic-ai';
import { createUserAction } from '../src/lib/actions/ai/create-user';
import { deactivateUserAction } from '../src/lib/actions/ai/deactivate-user';
import { deletePostAction } from '../src/lib/actions/ai/delete-post';
import { deleteTopicAction } from '../src/lib/actions/ai/delete-topic';
import { getCategoryAction } from '../src/lib/actions/ai/get-category';
import { getGroupAction } from '../src/lib/actions/ai/get-group';
import { getNotificationsAction } from '../src/lib/actions/ai/get-notifications';
import { getPostRepliesAction } from '../src/lib/actions/ai/get-post-replies';
import { getPostAction } from '../src/lib/actions/ai/get-post';
import { getSiteInfoAction } from '../src/lib/actions/ai/get-site-info';
import { getTopicByExternalIdAction } from '../src/lib/actions/ai/get-topic-by-external-id';
import { getTopicPostsAction } from '../src/lib/actions/ai/get-topic-posts';
import { getTopicAction } from '../src/lib/actions/ai/get-topic';
import { getUserByExternalIdAction } from '../src/lib/actions/ai/get-user-by-external-id';
import { getUserAction } from '../src/lib/actions/ai/get-user';
import { grantBadgeAction } from '../src/lib/actions/ai/grant-badge';
import { inviteToTopicAction } from '../src/lib/actions/ai/invite-to-topic';
import { likePostAction } from '../src/lib/actions/ai/like-post';
import { listBadgesAction } from '../src/lib/actions/ai/list-badges';
import { listCategoriesAction } from '../src/lib/actions/ai/list-categories';
import { listCategoryTopicsAction } from '../src/lib/actions/ai/list-category-topics';
import { listGroupMembersAction } from '../src/lib/actions/ai/list-group-members';
import { listGroupsAction } from '../src/lib/actions/ai/list-groups';
import { listLatestPostsAction } from '../src/lib/actions/ai/list-latest-posts';
import { listLatestTopicsAction } from '../src/lib/actions/ai/list-latest-topics';
import { listTagsAction } from '../src/lib/actions/ai/list-tags';
import { listTopTopicsAction } from '../src/lib/actions/ai/list-top-topics';
import { listUserActionsAction } from '../src/lib/actions/ai/list-user-actions';
import { listUserBadgesAction } from '../src/lib/actions/ai/list-user-badges';
import { listUserPrivateMessagesAction } from '../src/lib/actions/ai/list-user-private-messages';
import { listUsersAction } from '../src/lib/actions/ai/list-users';
import { logOutUserAction } from '../src/lib/actions/ai/log-out-user';
import { removeGroupMembersAction } from '../src/lib/actions/ai/remove-group-members';
import { replyToTopicAction } from '../src/lib/actions/ai/reply-to-topic';
import { searchAction } from '../src/lib/actions/ai/search';
import { setTopicStatusAction } from '../src/lib/actions/ai/set-topic-status';
import { setUserTrustLevelAction } from '../src/lib/actions/ai/set-user-trust-level';
import { silenceUserAction } from '../src/lib/actions/ai/silence-user';
import { suspendUserAction } from '../src/lib/actions/ai/suspend-user';
import { unsilenceUserAction } from '../src/lib/actions/ai/unsilence-user';
import { unsuspendUserAction } from '../src/lib/actions/ai/unsuspend-user';
import { updatePostAction } from '../src/lib/actions/ai/update-post';
import { updateTopicAction } from '../src/lib/actions/ai/update-topic';
import { updateUserAction } from '../src/lib/actions/ai/update-user';
import { API_KEY, BASE, call, FakeResponse, makeContext, stubFetch } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const TOPIC = {
  id: 42,
  title: 'Hello',
  slug: 'hello',
  category_id: 4,
  tags: ['a', { id: 2, name: 'b', slug: 'b' }],
  posts_count: 3,
  created_at: '2026-10-13T08:00:00Z',
  archetype: 'regular',
  details: { created_by: { username: 'alice' } },
  post_stream: { posts: [{ id: 500, post_number: 1, cooked: '<p>Hi</p>' }], stream: [500, 501, 502] },
};
const POST = { id: 501, topic_id: 42, post_number: 2, username: 'alice', raw: 'hi', cooked: '<p>hi</p>', topic_slug: 'hello', actions_summary: [{ id: 2, count: 3 }] };
const USER = { id: 7, username: 'alice', name: 'Alice', avatar_template: '/user_avatar/x/alice/{size}/1.png', trust_level: 1 };
const GROUP = { id: 41, name: 'team', display_name: 'Team', user_count: 2 };
const CATEGORY = { id: 4, name: 'General', slug: 'general', parent_category_id: null };

type Case = {
  action: { name: string; run: unknown; outputSchema?: { fields: { key: string }[] } };
  props: Record<string, unknown>;
  responses: FakeResponse[];
  requests: { method: string; path: string; query?: Record<string, string | string[]>; body?: unknown }[];
  output?: Record<string, unknown>;
};

const CASES: Case[] = [
  { action: createPost, props: { raw: 'hi', topic_id: 42 }, responses: [{ body: POST }], requests: [{ method: 'POST', path: '/posts.json', body: { topic_id: 42, raw: 'hi' } }], output: { id: 501, topic_url: `${BASE}/t/hello/42`, like_count: 3 } },
  { action: createTopic, props: { title: 'T', raw: 'body', category: 4 }, responses: [{ body: { ...POST, post_number: 1 } }], requests: [{ method: 'POST', path: '/posts.json', body: { title: 'T', raw: 'body', category: 4 } }], output: { already_existed: false } },
  { action: changeUserTrustLevel, props: { user_id: '7', new_trust_level: 2 }, responses: [{ body: { admin_user: { id: 7, username: 'alice', trust_level: 2 } } }], requests: [{ method: 'PUT', path: '/admin/users/7/trust_level.json', body: { level: 2 } }], output: { user_id: 7, trust_level: 2, username: 'alice' } },
  { action: addUsersToGroup, props: { group_id: 41, users: ['alice', ' bob ', 'ghost'] }, responses: [{ body: { success: 'OK', usernames: ['alice', 'bob'], emails: [] } }], requests: [{ method: 'PUT', path: '/groups/41/members.json', body: { usernames: 'alice,bob,ghost' } }], output: { usernames: 'alice, bob', skipped_usernames: 'ghost' } },
  { action: sendPrivateMessage, props: { title: 'T', raw: 'hey', target_recipients: ['alice', 'bob'], target_groups: ['staff'] }, responses: [{ body: POST }], requests: [{ method: 'POST', path: '/posts.json', body: { title: 'T', raw: 'hey', archetype: 'private_message', target_recipients: 'alice,bob', target_group_names: 'staff' } }] },
  { action: replyToTopicAction, props: { topic_id: '42', raw: 'r', reply_to_post_number: 1 }, responses: [{ body: POST }], requests: [{ method: 'POST', path: '/posts.json', body: { topic_id: 42, raw: 'r', reply_to_post_number: 1 } }] },
  { action: createTopicAiAction, props: { title: 'T', raw: 'b', category_id: '4', tags: ['x'], external_id: 'ext-1' }, responses: [{ status: 404, body: { errors: ['not found'] } }, { body: POST }], requests: [{ method: 'GET', path: '/t/external_id/ext-1.json' }, { method: 'POST', path: '/posts.json', body: { title: 'T', raw: 'b', category: 4, tags: ['x'], external_id: 'ext-1' } }], output: { already_existed: false } },
  { action: getTopicAction, props: { topic_id: '42' }, responses: [{ body: TOPIC }], requests: [{ method: 'GET', path: '/t/42.json' }], output: { id: 42, tags: 'a, b', first_post_id: 500, created_by_username: 'alice', url: `${BASE}/t/hello/42` } },
  { action: getTopicByExternalIdAction, props: { external_id: 'a b' }, responses: [{ body: TOPIC }], requests: [{ method: 'GET', path: '/t/external_id/a%20b.json' }], output: { id: 42 } },
  { action: getTopicPostsAction, props: { topic_id: '42', offset: 1, limit: 1 }, responses: [{ body: TOPIC }, { body: { post_stream: { posts: [POST] } } }], requests: [{ method: 'GET', path: '/t/42.json' }, { method: 'GET', path: '/t/42/posts.json', query: { 'post_ids[]': ['501'] } }], output: { count: 1, total_posts: 3, next_offset: 2, has_more: true } },
  { action: updateTopicAction, props: { topic_id: '42', title: 'New' }, responses: [{ body: { basic_topic: { id: 42, title: 'New', slug: 'new', category_id: 4 } } }], requests: [{ method: 'PUT', path: '/t/-/42.json', body: { title: 'New' } }], output: { title: 'New', url: `${BASE}/t/new/42` } },
  { action: setTopicStatusAction, props: { topic_id: '42', status: 'closed', enabled: false }, responses: [{ body: { success: 'OK' } }], requests: [{ method: 'PUT', path: '/t/42/status.json', body: { status: 'closed', enabled: 'false' } }], output: { enabled: false, until: null } },
  { action: deleteTopicAction, props: { topic_id: '42' }, responses: [{ body: { id: 42, deleted_at: null } }, { body: {} }], requests: [{ method: 'GET', path: '/t/42.json' }, { method: 'DELETE', path: '/t/42.json' }], output: { deleted: true, already_deleted: false } },
  { action: listLatestTopicsAction, props: { order: 'created', page: 1 }, responses: [{ body: { topic_list: { topics: [TOPIC], more_topics_url: '/latest?page=2' } } }], requests: [{ method: 'GET', path: '/latest.json', query: { order: 'created', page: '1' } }], output: { count: 1, next_page: 2, has_more: true } },
  { action: listTopTopicsAction, props: { period: 'monthly' }, responses: [{ body: { topic_list: { topics: [TOPIC] } } }], requests: [{ method: 'GET', path: '/top.json', query: { period: 'monthly', page: '0' } }], output: { has_more: false, next_page: null } },
  { action: listCategoryTopicsAction, props: { category_id: '4' }, responses: [{ body: { category: CATEGORY } }, { body: { topic_list: { topics: [TOPIC] } } }], requests: [{ method: 'GET', path: '/c/4/show.json' }, { method: 'GET', path: '/c/general/4.json', query: { page: '0' } }] },
  { action: searchAction, props: { query: 'hello @alice' }, responses: [{ body: { topics: [TOPIC], posts: [{ id: 1, topic_id: 42, blurb: 'x' }], users: [USER], categories: [CATEGORY], grouped_search_result: { more_full_page_results: true } } }], requests: [{ method: 'GET', path: '/search.json', query: { q: 'hello @alice', page: '1' } }], output: { has_more: true, page: 1 } },
  { action: getPostAction, props: { post_id: '501' }, responses: [{ body: POST }], requests: [{ method: 'GET', path: '/posts/501.json' }], output: { url: `${BASE}/t/hello/42/2` } },
  { action: updatePostAction, props: { post_id: '501', raw: 'new', edit_reason: 'typo' }, responses: [{ body: { post: POST } }], requests: [{ method: 'PUT', path: '/posts/501.json', body: { post: { raw: 'new', edit_reason: 'typo' } } }] },
  { action: deletePostAction, props: { post_id: '501' }, responses: [{ body: { ...POST, deleted_at: null } }, { body: {} }], requests: [{ method: 'GET', path: '/posts/501.json' }, { method: 'DELETE', path: '/posts/501.json' }], output: { deleted: true, already_deleted: false } },
  { action: listLatestPostsAction, props: { before: '600' }, responses: [{ body: { latest_posts: [POST, { ...POST, id: 499 }] } }], requests: [{ method: 'GET', path: '/posts.json', query: { before: '600' } }], output: { next_before: 499, has_more: true } },
  { action: getPostRepliesAction, props: { post_id: '500' }, responses: [{ body: [POST] }], requests: [{ method: 'GET', path: '/posts/500/replies.json' }], output: { count: 1 } },
  { action: likePostAction, props: { post_id: '501' }, responses: [{ body: POST }], requests: [{ method: 'POST', path: '/post_actions.json', body: { id: 501, post_action_type_id: 2 } }], output: { liked: true, like_count: 3 } },
  { action: listUserPrivateMessagesAction, props: { username: 'alice', folder: 'sent' }, responses: [{ body: { topic_list: { topics: [] } } }], requests: [{ method: 'GET', path: '/topics/private-messages-sent/alice.json', query: { page: '0' } }], output: { count: 0 } },
  { action: listCategoriesAction, props: {}, responses: [{ body: { category_list: { categories: [{ ...CATEGORY, subcategory_list: [{ id: 9, name: 'Sub', slug: 'sub' }] }] } } }], requests: [{ method: 'GET', path: '/categories.json', query: { include_subcategories: 'true' } }], output: { count: 2 } },
  { action: getCategoryAction, props: { category_id: '4' }, responses: [{ body: { category: CATEGORY } }], requests: [{ method: 'GET', path: '/c/4/show.json' }], output: { url: `${BASE}/c/general/4` } },
  { action: createCategoryAction, props: { name: 'New', color: '#ff0000' }, responses: [{ body: { category: CATEGORY } }], requests: [{ method: 'POST', path: '/categories.json', body: { name: 'New', color: 'FF0000', text_color: 'FFFFFF' } }] },
  { action: listTagsAction, props: {}, responses: [{ body: { tags: [{ id: 'x', text: 'x', count: 2 }] } }], requests: [{ method: 'GET', path: '/tags.json' }], output: { count: 1 } },
  { action: getUserAction, props: { username: 'alice' }, responses: [{ body: { user: USER } }], requests: [{ method: 'GET', path: '/u/alice.json' }], output: { avatar_url: `${BASE}/user_avatar/x/alice/240/1.png` } },
  { action: getUserByExternalIdAction, props: { external_id: 'sso-1' }, responses: [{ body: { user: USER } }], requests: [{ method: 'GET', path: '/u/by-external/sso-1.json' }] },
  { action: adminGetUserAction, props: { user_id: '7' }, responses: [{ body: { ...USER, email: 'a@x.io', single_sign_on_record: { external_id: 'e1' } } }], requests: [{ method: 'GET', path: '/admin/users/7.json' }], output: { email: 'a@x.io', external_id: 'e1' } },
  { action: listUsersAction, props: { flag: 'staff', filter: 'al', show_emails: true }, responses: [{ body: [USER] }], requests: [{ method: 'GET', path: '/admin/users/list/staff.json', query: { filter: 'al', show_emails: 'true', page: '1' } }], output: { has_more: false } },
  { action: createUserAction, props: { name: 'A', email: 'a@x.io', username: 'a', password: 'secret-pass', active: true }, responses: [{ body: { success: true, active: true, user_id: 9, message: 'ok' } }], requests: [{ method: 'POST', path: '/users.json', body: { name: 'A', email: 'a@x.io', username: 'a', password: 'secret-pass', active: true, approved: false } }], output: { user_id: 9 } },
  { action: updateUserAction, props: { username: 'alice', name: 'Al', clear_fields: ['website'] }, responses: [{ body: { success: 'OK', user: USER } }], requests: [{ method: 'PUT', path: '/u/alice.json', body: { name: 'Al', website: '' } }], output: { success: true } },
  { action: setUserTrustLevelAction, props: { user_id: '7', level: 3 }, responses: [{ body: { admin_user: { id: 7, trust_level: 3 } } }], requests: [{ method: 'PUT', path: '/admin/users/7/trust_level.json', body: { level: 3 } }] },
  { action: suspendUserAction, props: { user_id: '7', suspend_until: '2030-01-01T00:00:00Z', reason: 'spam' }, responses: [{ body: { suspension: { suspended_till: '2030-01-01T00:00:00.000Z', suspend_reason: 'spam' } } }], requests: [{ method: 'PUT', path: '/admin/users/7/suspend.json', body: { suspend_until: '2030-01-01T00:00:00.000Z', reason: 'spam' } }], output: { action: 'suspend', reason: 'spam' } },
  { action: unsuspendUserAction, props: { user_id: '7' }, responses: [{ body: { suspension: {} } }], requests: [{ method: 'PUT', path: '/admin/users/7/unsuspend.json' }] },
  { action: silenceUserAction, props: { user_id: '7', reason: 'r' }, responses: [{ body: { silence: { silenced: true } } }], requests: [{ method: 'PUT', path: '/admin/users/7/silence.json', body: { reason: 'r' } }] },
  { action: unsilenceUserAction, props: { user_id: '7' }, responses: [{ body: { unsilence: {} } }], requests: [{ method: 'PUT', path: '/admin/users/7/unsilence.json' }] },
  { action: activateUserAction, props: { user_id: '7' }, responses: [{ body: { success: 'OK' } }], requests: [{ method: 'PUT', path: '/admin/users/7/activate.json' }] },
  { action: deactivateUserAction, props: { user_id: '7' }, responses: [{ body: { success: 'OK' } }], requests: [{ method: 'PUT', path: '/admin/users/7/deactivate.json' }] },
  { action: logOutUserAction, props: { user_id: '7' }, responses: [{ body: { success: 'OK' } }], requests: [{ method: 'POST', path: '/admin/users/7/log_out.json' }] },
  { action: listUserActionsAction, props: { username: 'alice', filter: ['4', '5'] }, responses: [{ body: { user_actions: [{ action_type: 4, topic_id: 42 }] } }], requests: [{ method: 'GET', path: '/user_actions.json', query: { username: 'alice', offset: '0', filter: '4,5' } }], output: { next_offset: null } },
  { action: listGroupsAction, props: { filter: 'te' }, responses: [{ body: { groups: [GROUP], total_rows_groups: 1, load_more_groups: '/groups?page=1' } }], requests: [{ method: 'GET', path: '/groups.json', query: { page: '0', filter: 'te' } }], output: { total: 1 } },
  { action: getGroupAction, props: { group_name: 'team' }, responses: [{ body: { group: GROUP } }], requests: [{ method: 'GET', path: '/groups/team.json' }], output: { id: 41 } },
  { action: listGroupMembersAction, props: { group_name: 'team', limit: 1 }, responses: [{ body: { members: [USER], owners: [USER], meta: { total: 2, limit: 1, offset: 0 } } }], requests: [{ method: 'GET', path: '/groups/team/members.json', query: { offset: '0', limit: '1' } }], output: { next_offset: 1, has_more: true } },
  { action: addGroupMembersAction, props: { group_id: '41', usernames: ['alice'] }, responses: [{ body: { success: 'OK', usernames: ['alice'], emails: [] } }], requests: [{ method: 'PUT', path: '/groups/41/members.json', body: { usernames: 'alice' } }] },
  { action: removeGroupMembersAction, props: { group_id: '41', usernames: ['alice', 'bob'] }, responses: [{ body: { success: 'OK', usernames: ['alice'], skipped_usernames: ['bob'] } }], requests: [{ method: 'DELETE', path: '/groups/41/members.json', body: { usernames: 'alice,bob' } }], output: { skipped_usernames: 'bob' } },
  { action: createGroupAction, props: { name: 'team', full_name: 'Team', visibility_level: 1, usernames: ['alice'] }, responses: [{ body: { basic_group: GROUP } }], requests: [{ method: 'POST', path: '/admin/groups.json', body: { group: { name: 'team', full_name: 'Team', visibility_level: 1, usernames: 'alice' } } }] },
  { action: createInviteAction, props: { email: 'x@y.io', skip_email: true, group_ids: ['41'], topic_id: '42' }, responses: [{ body: { id: 1, link: `${BASE}/invites/abc`, email: 'x@y.io', emailed: false } }], requests: [{ method: 'POST', path: '/invites.json', body: { email: 'x@y.io', skip_email: true, group_ids: [41], topic_id: 42 } }], output: { emailed: false } },
  { action: inviteToTopicAction, props: { topic_id: '42', user: 'bob' }, responses: [{ body: { user: { id: 8, username: 'bob' } } }], requests: [{ method: 'POST', path: '/t/42/invite.json', body: { user: 'bob' } }], output: { user_id: 8 } },
  { action: grantBadgeAction, props: { username: 'alice', badge_id: '3' }, responses: [{ body: { badges: [{ id: 3, name: 'Helper' }], user_badge: { id: 99, badge_id: 3 } } }], requests: [{ method: 'POST', path: '/user_badges.json', body: { username: 'alice', badge_id: 3 } }], output: { badge_name: 'Helper' } },
  { action: listBadgesAction, props: {}, responses: [{ body: { badges: [{ id: 3, name: 'Helper' }] } }], requests: [{ method: 'GET', path: '/badges.json' }] },
  { action: listUserBadgesAction, props: { username: 'alice' }, responses: [{ body: { badges: [{ id: 3, name: 'Helper' }], user_badges: [{ id: 99, badge_id: 3 }] } }], requests: [{ method: 'GET', path: '/user-badges/alice.json' }] },
  { action: getNotificationsAction, props: {}, responses: [{ body: { notifications: [{ id: 1, data: { display_username: 'bob' } }], total_rows_notifications: 5 } }], requests: [{ method: 'GET', path: '/notifications.json', query: { offset: '0' } }], output: { next_offset: 1 } },
  { action: getSiteInfoAction, props: {}, responses: [{ body: { title: 'Forum', login_required: false } }], requests: [{ method: 'GET', path: '/site/basic-info.json' }], output: { url: BASE } },
];

describe('every action sends the documented request', () => {
  it('covers every action of the piece except custom_api_call', () => {
    const names = Object.keys(discourse.actions()).filter((name) => name !== 'custom_api_call').sort();
    expect(CASES.map((testCase) => testCase.action.name).sort()).toEqual(names);
  });

  for (const testCase of CASES) {
    it(testCase.action.name, async () => {
      const calls = stubFetch(testCase.responses);
      const output = await call({ fn: testCase.action.run, ctx: makeContext({ props: testCase.props }) });
      expect(calls).toHaveLength(testCase.requests.length);
      testCase.requests.forEach((expected, index) => {
        const actual = calls[index];
        expect(actual.method).toBe(expected.method);
        expect(actual.url.origin + actual.url.pathname).toBe(BASE + expected.path);
        expect(actual.headers['api-key']).toBe(API_KEY);
        expect(actual.headers['api-username']).toBe('system');
        expect(actual.redirect).toBe('manual');
        const query: Record<string, string | string[]> = {};
        actual.url.searchParams.forEach((value, key) => {
          const existing = query[key];
          query[key] = key.endsWith('[]') ? [...(Array.isArray(existing) ? existing : []), value] : value;
        });
        expect(query).toEqual(expected.query ?? {});
        expect(actual.body).toEqual(expected.body);
      });
      expect(output).toMatchObject(testCase.output ?? {});
      const schemaKeys = (testCase.action.outputSchema?.fields ?? []).map((field) => field.key).sort();
      expect(Object.keys(output !== null && typeof output === 'object' ? output : {}).sort()).toEqual(schemaKeys);
    });
  }
});

describe('markdown bodies keep their whitespace', () => {
  it.each([
    { action: createPost, props: { raw: '    const answer = 42;\n', topic_id: 42 }, raw: '    const answer = 42;\n' },
    { action: sendPrivateMessage, props: { title: 'T', raw: '  - indented item', target_recipients: ['alice'] }, raw: '  - indented item' },
  ])('$action.name sends the body untrimmed', async ({ action, props, raw }) => {
    const calls = stubFetch([{ body: POST }]);
    await call({ fn: action.run, ctx: makeContext({ props }) });
    expect(calls[0].body).toMatchObject({ raw });
  });

  it('still rejects a blank body', async () => {
    stubFetch([{ body: POST }]);
    await expect(call({ fn: createPost.run, ctx: makeContext({ props: { raw: '   ', topic_id: 42 } }) })).rejects.toThrow('Post Content is required');
  });
});
