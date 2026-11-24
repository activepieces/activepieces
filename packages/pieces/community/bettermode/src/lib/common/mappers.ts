import { isRecord, readPath } from './client';

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function decodeFieldValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (typeof parsed === 'number' || typeof parsed === 'boolean') {
      return String(parsed);
    }
    return value;
  } catch {
    return value;
  }
}

function post(value: unknown) {
  const tags = records(readPath({ value: value, path: ['tags'] }));
  const fields = records(readPath({ value: value, path: ['fields'] }));
  const contentField = fields.find((field) => field['key'] === 'content');
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    title: text(readPath({ value: value, path: ['title'] })),
    slug: text(readPath({ value: value, path: ['slug'] })),
    url: text(readPath({ value: value, path: ['url'] })),
    status: text(readPath({ value: value, path: ['status'] })),
    space_id: text(readPath({ value: value, path: ['spaceId'] })),
    space_name: text(readPath({ value: value, path: ['space', 'name'] })),
    post_type_id: text(readPath({ value: value, path: ['postTypeId'] })),
    post_type_name: text(readPath({ value: value, path: ['postType', 'name'] })),
    owner_id: text(readPath({ value: value, path: ['ownerId'] })),
    owner_name: text(readPath({ value: value, path: ['owner', 'member', 'name'] })),
    replied_to_id: text(readPath({ value: value, path: ['repliedToId'] })),
    content_html: contentField === undefined ? null : decodeFieldValue(contentField['value']),
    text_content: text(readPath({ value: value, path: ['textContent'] })),
    short_content: text(readPath({ value: value, path: ['shortContent'] })),
    tags: tags.map((tag) => text(tag['title'])).filter((tag): tag is string => tag !== null).join(', '),
    tag_ids: tags.map((tag) => text(tag['id'])).filter((tag): tag is string => tag !== null).join(', '),
    replies_count: num(readPath({ value: value, path: ['repliesCount'] })),
    reactions_count: num(readPath({ value: value, path: ['reactionsCount'] })),
    locked: bool(readPath({ value: value, path: ['locked'] })),
    hidden: bool(readPath({ value: value, path: ['isHidden'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
    updated_at: text(readPath({ value: value, path: ['updatedAt'] })),
    published_at: text(readPath({ value: value, path: ['publishedAt'] })),
  };
}

function member(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    name: text(readPath({ value: value, path: ['name'] })),
    email: text(readPath({ value: value, path: ['email'] })),
    username: text(readPath({ value: value, path: ['username'] })),
    tagline: text(readPath({ value: value, path: ['tagline'] })),
    status: text(readPath({ value: value, path: ['status'] })),
    role_id: text(readPath({ value: value, path: ['role', 'id'] })),
    role_name: text(readPath({ value: value, path: ['role', 'name'] })),
    url: text(readPath({ value: value, path: ['url'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
  };
}

function space(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    name: text(readPath({ value: value, path: ['name'] })),
    slug: text(readPath({ value: value, path: ['slug'] })),
    url: text(readPath({ value: value, path: ['url'] })),
    description: text(readPath({ value: value, path: ['description'] })),
    type: text(readPath({ value: value, path: ['type'] })),
    private: bool(readPath({ value: value, path: ['private'] })),
    hidden: bool(readPath({ value: value, path: ['hidden'] })),
    members_count: num(readPath({ value: value, path: ['membersCount'] })),
    posts_count: num(readPath({ value: value, path: ['postsCount'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
  };
}

function spaceMember(value: unknown) {
  return {
    member_id: text(readPath({ value: value, path: ['member', 'id'] })),
    member_name: text(readPath({ value: value, path: ['member', 'name'] })),
    member_email: text(readPath({ value: value, path: ['member', 'email'] })),
    member_username: text(readPath({ value: value, path: ['member', 'username'] })),
    role_id: text(readPath({ value: value, path: ['role', 'id'] })),
    role_name: text(readPath({ value: value, path: ['role', 'name'] })),
  };
}

function postType(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    name: text(readPath({ value: value, path: ['name'] })),
    plural_name: text(readPath({ value: value, path: ['pluralName'] })),
    slug: text(readPath({ value: value, path: ['slug'] })),
    context: text(readPath({ value: value, path: ['context'] })),
    archived: bool(readPath({ value: value, path: ['archived'] })),
  };
}

function tag(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    title: text(readPath({ value: value, path: ['title'] })),
    slug: text(readPath({ value: value, path: ['slug'] })),
    description: text(readPath({ value: value, path: ['description'] })),
  };
}

function badge(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    name: text(readPath({ value: value, path: ['name'] })),
    short_description: text(readPath({ value: value, path: ['shortDescription'] })),
    type: text(readPath({ value: value, path: ['type'] })),
    active: bool(readPath({ value: value, path: ['active'] })),
  };
}

function event(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    title: text(readPath({ value: value, path: ['title'] })),
    slug: text(readPath({ value: value, path: ['slug'] })),
    url: text(readPath({ value: value, path: ['url'] })),
    status: text(readPath({ value: value, path: ['status'] })),
    space_id: text(readPath({ value: value, path: ['spaceId'] })),
    start_time: text(readPath({ value: value, path: ['startTime'] })),
    end_time: text(readPath({ value: value, path: ['endTime'] })),
    time_zone: text(readPath({ value: value, path: ['timeZone'] })),
    capacity: num(readPath({ value: value, path: ['capacity'] })),
    registrations_count: num(readPath({ value: value, path: ['registrationsCount'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
  };
}

function moderationItem(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    status: text(readPath({ value: value, path: ['status'] })),
    flagged_by: text(readPath({ value: value, path: ['flaggedBy'] })),
    description: text(readPath({ value: value, path: ['description'] })),
    member_id: text(readPath({ value: value, path: ['memberId'] })),
    space_id: text(readPath({ value: value, path: ['spaceId'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
    updated_at: text(readPath({ value: value, path: ['updatedAt'] })),
  };
}

function invitation(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    invitee_email: text(readPath({ value: value, path: ['inviteeEmail'] })),
    invitee_name: text(readPath({ value: value, path: ['inviteeName'] })),
    status: text(readPath({ value: value, path: ['status'] })),
    expires_at: text(readPath({ value: value, path: ['expiresAt'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
  };
}

function network(value: unknown) {
  return {
    id: text(readPath({ value: value, path: ['id'] })),
    name: text(readPath({ value: value, path: ['name'] })),
    domain: text(readPath({ value: value, path: ['domain'] })),
    description: text(readPath({ value: value, path: ['description'] })),
    plan_name: text(readPath({ value: value, path: ['planName'] })),
    members_count: num(readPath({ value: value, path: ['membersCount'] })),
    created_at: text(readPath({ value: value, path: ['createdAt'] })),
  };
}

function page<T>({ value, map }: { value: unknown; map: (item: unknown) => T }) {
  const hasMore = readPath({ value: value, path: ['pageInfo', 'hasNextPage'] }) === true;
  const cursor = text(readPath({ value: value, path: ['pageInfo', 'endCursor'] }));
  return {
    items: records(readPath({ value: value, path: ['nodes'] })).map(map),
    next_cursor: hasMore ? cursor : null,
    has_more: hasMore,
    total_count: num(readPath({ value: value, path: ['totalCount'] })),
  };
}

function actionStatus(value: unknown): string | null {
  return text(readPath({ value: value, path: ['status'] }));
}

export const bettermodeMap = {
  post,
  member,
  space,
  spaceMember,
  postType,
  tag,
  badge,
  event,
  moderationItem,
  invitation,
  network,
  page,
  actionStatus,
  records,
  text,
};
