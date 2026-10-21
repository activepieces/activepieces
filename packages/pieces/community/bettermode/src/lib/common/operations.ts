import { bettermodeQuery, BettermodeCredentials, readPath } from './client';
import { BADGE_FIELDS, MEMBER_FIELDS, PAGE_INFO, POST_FIELDS, POST_TYPE_FIELDS, SPACE_FIELDS } from './fields';
import { bettermodeInput } from './input';
import { bettermodeMap } from './mappers';

async function createPost({
  auth,
  spaceId,
  postTypeId,
  title,
  content,
  tagNames,
  locked,
}: {
  auth: BettermodeCredentials;
  spaceId: string;
  postTypeId: string;
  title: string;
  content: string;
  tagNames: string[];
  locked: boolean | undefined;
}) {
  const input: Record<string, unknown> = {
    postTypeId,
    mappingFields: [
      { key: 'title', type: 'text', value: JSON.stringify(title) },
      { key: 'content', type: 'html', value: JSON.stringify(content) },
    ],
  };
  if (tagNames.length > 0) {
    input['tagNames'] = tagNames;
  }
  if (locked !== undefined) {
    input['locked'] = locked;
  }
  const data = await bettermodeQuery({
    auth,
    query: `mutation CreatePost($spaceId: ID!, $input: CreatePostInput!) {
  createPost(spaceId: $spaceId, input: $input) {
${POST_FIELDS}
  }
}`,
    variables: { spaceId, input },
  });
  return publishIfDraft({ auth, post: bettermodeMap.post(data['createPost']) });
}

async function publishIfDraft({
  auth,
  post,
}: {
  auth: BettermodeCredentials;
  post: ReturnType<typeof bettermodeMap.post>;
}): Promise<ReturnType<typeof bettermodeMap.post>> {
  if (post.status !== 'DRAFT' || post.id === null) {
    return post;
  }
  const data = await bettermodeQuery({
    auth,
    query: `mutation PublishPost($postId: ID!) {
  publishPost(postId: $postId) {
${POST_FIELDS}
  }
}`,
    variables: { postId: post.id },
  });
  return bettermodeMap.post(data['publishPost']);
}

async function findPostTypeByName({
  auth,
  name,
  spaceId,
}: {
  auth: BettermodeCredentials;
  name: string;
  spaceId?: string;
}): Promise<{ id: string; name: string }> {
  const wanted = name.trim().toLowerCase();
  const spaceTypes = spaceId === undefined ? null : await listSpacePostTypes({ auth, spaceId });
  const types = spaceTypes ?? (await listAllPostTypes({ auth, context: 'post' }));
  const match = types.find((type) => type.name !== null && type.name.trim().toLowerCase() === wanted);
  if (match === undefined || match.id === null || match.name === null) {
    const available = types.map((type) => type.name).filter((typeName): typeName is string => typeName !== null);
    const scope = spaceTypes === null ? 'exists in this community' : 'is available in this space';
    throw new Error(
      `No post type named "${name}" ${scope}. Available post types: ${available.length > 0 ? available.join(', ') : 'none'}.`
    );
  }
  return { id: match.id, name: match.name };
}

async function listSpacePostTypes({
  auth,
  spaceId,
}: {
  auth: BettermodeCredentials;
  spaceId: string;
}): Promise<ReturnType<typeof bettermodeMap.postType>[] | null> {
  const data = await bettermodeQuery({
    auth,
    query: `query GetSpacePostTypes($id: ID!) {
  space(id: $id) {
    authMemberProps {
      availablePostTypes {
${POST_TYPE_FIELDS}
      }
    }
  }
}`,
    variables: { id: spaceId },
  });
  const available = readPath({ value: data, path: ['space', 'authMemberProps', 'availablePostTypes'] });
  if (!Array.isArray(available)) {
    return null;
  }
  return available
    .map((type) => bettermodeMap.postType(type))
    .filter((type) => type.context === null || type.context === 'post');
}

async function listAllPostTypes({
  auth,
  context,
}: {
  auth: BettermodeCredentials;
  context: 'post' | 'reply' | undefined;
}) {
  const results: ReturnType<typeof bettermodeMap.postType>[][] = [];
  let after: string | null = null;
  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
    const data = await bettermodeQuery({
      auth,
      query: `query ListPostTypes($limit: Int!, $after: String, $context: PostTypeContext) {
  postTypes(limit: $limit, after: $after, context: $context) {
    nodes {
${POST_TYPE_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: { limit: PAGE_SIZE, after, context },
    });
    const page = bettermodeMap.page({ value: data['postTypes'], map: bettermodeMap.postType });
    results.push(page.items);
    if (!page.has_more || page.next_cursor === null) {
      return results.flat();
    }
    after = page.next_cursor;
  }
  return results.flat();
}

async function findMemberByEmail({ auth, email }: { auth: BettermodeCredentials; email: string }) {
  const wanted = email.trim().toLowerCase();
  let after: string | null = null;
  for (let pageIndex = 0; pageIndex < MAX_EMAIL_PAGES; pageIndex++) {
    const data = await bettermodeQuery({
      auth,
      query: `query FindMembers($query: String!, $limit: Int!, $after: String) {
  members(query: $query, limit: $limit, after: $after) {
    nodes {
${MEMBER_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
      variables: { query: email.trim(), limit: PAGE_SIZE, after },
    });
    const page = bettermodeMap.page({ value: data['members'], map: bettermodeMap.member });
    const match = page.items.find((item) => item.email !== null && item.email.trim().toLowerCase() === wanted);
    if (match !== undefined) {
      return match;
    }
    if (!page.has_more || page.next_cursor === null) {
      return null;
    }
    after = page.next_cursor;
  }
  throw new Error(
    `Could not confirm a member with email ${email}: the search returned more than ${MAX_EMAIL_PAGES * PAGE_SIZE} partial matches. Use the member ID instead.`
  );
}

async function requireMemberByEmail({ auth, email }: { auth: BettermodeCredentials; email: string }) {
  const member = await findMemberByEmail({ auth, email });
  if (member === null || member.id === null) {
    throw new Error(
      `No member with email ${email} was found. The email must match exactly, and the connected account must be an admin to see member emails.`
    );
  }
  return { ...member, id: member.id };
}

async function changeBadge({
  auth,
  operation,
  badgeId,
  memberId,
}: {
  auth: BettermodeCredentials;
  operation: 'assignBadge' | 'revokeBadge';
  badgeId: string;
  memberId: string;
}) {
  const data = await bettermodeQuery({
    auth,
    query: BADGE_MUTATIONS[operation],
    variables: { badgeId, input: { memberId } },
  });
  const status = expectSucceeded({ value: data[operation], operation });
  return { success: true, status, badge_id: badgeId, member_id: memberId };
}

async function runActionMutation({
  auth,
  query,
  variables,
  field,
}: {
  auth: BettermodeCredentials;
  query: string;
  variables: Record<string, unknown>;
  field: string;
}): Promise<string> {
  const data = await bettermodeQuery({ auth, query, variables });
  return expectSucceeded({ value: data[field], operation: field });
}

function expectSucceeded({ value, operation }: { value: unknown; operation: string }): string {
  const status = bettermodeMap.actionStatus(value);
  if (status !== 'succeeded') {
    throw new Error(`Bettermode did not complete ${operation} (status: ${status ?? 'missing'}).`);
  }
  return status;
}

async function listBadges({ auth }: { auth: BettermodeCredentials }) {
  const data = await bettermodeQuery({
    auth,
    query: `query ListBadges {
  network {
    badges {
${BADGE_FIELDS}
    }
  }
}`,
  });
  return bettermodeMap.records(readPath({ value: data, path: ['network', 'badges'] })).map(bettermodeMap.badge);
}

async function listSpacesPage({
  auth,
  limit,
  after,
  query,
  memberId,
}: {
  auth: BettermodeCredentials;
  limit: number;
  after: string | null;
  query: string | undefined;
  memberId: string | undefined;
}) {
  const data = await bettermodeQuery({
    auth,
    query: `query ListSpaces($limit: Int!, $after: String, $query: String, $memberId: ID) {
  spaces(limit: $limit, after: $after, query: $query, memberId: $memberId) {
    nodes {
${SPACE_FIELDS}
    }
    ${PAGE_INFO}
  }
}`,
    variables: { limit, after, query, memberId },
  });
  return bettermodeMap.page({ value: data['spaces'], map: bettermodeMap.space });
}

function tagNames(value: unknown): string[] {
  return bettermodeInput.stringList({ value, label: 'Tags' });
}

const BADGE_MUTATIONS = {
  assignBadge: `mutation AssignBadge($badgeId: String!, $input: AssignOrRevokeBadgeInput!) {
  assignBadge(id: $badgeId, input: $input) {
    status
  }
}`,
  revokeBadge: `mutation RevokeBadge($badgeId: String!, $input: AssignOrRevokeBadgeInput!) {
  revokeBadge(id: $badgeId, input: $input) {
    status
  }
}`,
};

const PAGE_SIZE = 50;
const MAX_PAGES = 10;
const MAX_EMAIL_PAGES = 5;

export const bettermodeOps = {
  createPost,
  findPostTypeByName,
  publishIfDraft,
  listAllPostTypes,
  findMemberByEmail,
  requireMemberByEmail,
  changeBadge,
  runActionMutation,
  listBadges,
  listSpacesPage,
  tagNames,
  MAX_PAGES,
};
