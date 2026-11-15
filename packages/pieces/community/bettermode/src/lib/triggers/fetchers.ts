import { BettermodeCredentials, bettermodeQuery, readPath } from '../common/client';
import { MEMBER_FIELDS, PAGE_INFO, POST_FIELDS } from '../common/fields';
import { bettermodeInput } from '../common/input';
import { bettermodeMap } from '../common/mappers';
import { bettermodePolling } from '../common/polling';

async function fetchPostsPage({
  auth,
  spaceIds,
  postTypeIds,
  cursor,
  limit,
}: {
  auth: BettermodeCredentials;
  spaceIds: string[];
  postTypeIds: string[];
  cursor: string | null;
  limit: number;
}) {
  const data = await bettermodeQuery({
    auth,
    query: `query PollPosts($limit: Int!, $after: String, $spaceIds: [ID!], $postTypeIds: [String!], $orderBy: PostListOrderByEnum, $reverse: Boolean) {
  posts(limit: $limit, after: $after, spaceIds: $spaceIds, postTypeIds: $postTypeIds, orderBy: $orderBy, reverse: $reverse) {
    nodes {
${POST_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
    variables: {
      limit,
      after: cursor,
      spaceIds: spaceIds.length > 0 ? spaceIds : undefined,
      postTypeIds: postTypeIds.length > 0 ? postTypeIds : undefined,
      orderBy: 'publishedAt',
      reverse: true,
    },
  });
  const page = bettermodeMap.page({ value: data['posts'], map: bettermodeMap.post });
  return { ...page, items: page.items.filter((post) => post.published_at !== null && (post.status === null || post.status === 'PUBLISHED')) };
}

async function fetchMembersPage({
  auth,
  cursor,
  limit,
}: {
  auth: BettermodeCredentials;
  cursor: string | null;
  limit: number;
}) {
  const data = await bettermodeQuery({
    auth,
    query: `query PollMembers($limit: Int!, $after: String, $orderBy: String, $reverse: Boolean) {
  members(limit: $limit, after: $after, orderBy: $orderBy, reverse: $reverse) {
    nodes {
${MEMBER_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
    variables: { limit, after: cursor, orderBy: 'createdAt', reverse: true },
  });
  return bettermodeMap.page({ value: data['members'], map: bettermodeMap.member });
}

async function fetchRecentReplies({
  auth,
  spaceIds,
}: {
  auth: BettermodeCredentials;
  spaceIds: string[];
}) {
  const active = await bettermodeQuery({
    auth,
    query: `query PollActivePosts($limit: Int!, $spaceIds: [ID!], $orderBy: PostListOrderByEnum, $reverse: Boolean) {
  posts(limit: $limit, spaceIds: $spaceIds, orderBy: $orderBy, reverse: $reverse) {
    nodes {
      id
      repliesCount
    }
  }
}`,
    variables: {
      limit: ACTIVE_POSTS_PER_POLL,
      spaceIds: spaceIds.length > 0 ? spaceIds : undefined,
      orderBy: 'lastActivityAt',
      reverse: true,
    },
  });
  const postIds = bettermodeMap
    .records(readPath({ value: active, path: ['posts', 'nodes'] }))
    .filter((node) => typeof node['repliesCount'] !== 'number' || node['repliesCount'] > 0)
    .map((node) => node['id'])
    .filter((id): id is string => typeof id === 'string');
  if (postIds.length === 0) {
    return { items: [], next_cursor: null, has_more: false };
  }
  const declarations = postIds.map((_, index) => `$p${index}: ID!`).join(', ');
  const selections = postIds
    .map(
      (_, index) => `  r${index}: replies(postId: $p${index}, limit: ${REPLIES_PER_POST}, orderBy: createdAt, reverse: true) {
    nodes {
${POST_FIELDS}
    }
  }`
    )
    .join('\n');
  const variables = Object.fromEntries(postIds.map((id, index) => [`p${index}`, id]));
  const data = await bettermodeQuery({
    auth,
    query: `query PollReplies(${declarations}) {
${selections}
}`,
    variables,
  });
  const replies = postIds
    .flatMap((_, index) => bettermodeMap.records(readPath({ value: data, path: [`r${index}`, 'nodes'] })))
    .map((node) => bettermodeMap.post(node))
    .sort((left, right) => (Date.parse(right.created_at ?? '') || 0) - (Date.parse(left.created_at ?? '') || 0));
  return { items: replies, next_cursor: null, has_more: false };
}

function spaceFilter(value: unknown): string[] {
  return bettermodeInput.stringList({ value, label: 'Space IDs' });
}

const ACTIVE_POSTS_PER_POLL = 25;
const REPLIES_PER_POST = 20;

export const bettermodeFetchers = {
  fetchPostsPage,
  fetchMembersPage,
  fetchRecentReplies,
  spaceFilter,
  pageSize: bettermodePolling.POLL_PAGE_SIZE,
};
