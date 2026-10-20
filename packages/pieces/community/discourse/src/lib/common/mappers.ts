import { isRecord } from './client';

function rec(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function str(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function tagNames(value: unknown): string | null {
  const names = list(value)
    .map((tag) => (typeof tag === 'string' ? tag : str(rec(tag)['name'])))
    .filter((tag): tag is string => tag !== null && tag.length > 0);
  return names.length === 0 ? null : names.join(', ');
}

function absoluteUrl({ baseUrl, value }: { baseUrl: string; value: unknown }): string | null {
  const text = str(value);
  if (text === null || text.length === 0) {
    return null;
  }
  if (/^https?:\/\//i.test(text)) {
    return text;
  }
  if (text.startsWith('//')) {
    return `https:${text}`;
  }
  return `${new URL(baseUrl).origin}${text.startsWith('/') ? '' : '/'}${text}`;
}

function avatar({ baseUrl, template }: { baseUrl: string; template: unknown }): string | null {
  const text = str(template);
  return text === null ? null : absoluteUrl({ baseUrl, value: text.replace('{size}', '240') });
}

function topicUrl({ baseUrl, slug, id }: { baseUrl: string; slug: unknown; id: unknown }): string | null {
  const topicId = num(id);
  if (topicId === null) {
    return null;
  }
  const topicSlug = str(slug) ?? 'topic';
  return `${baseUrl}/t/${encodeURIComponent(topicSlug)}/${topicId}`;
}

function topicSummary({ raw, baseUrl }: { raw: unknown; baseUrl: string }) {
  const topic = rec(raw);
  return {
    id: num(topic['id']),
    title: str(topic['title']),
    slug: str(topic['slug']),
    url: topicUrl({ baseUrl, slug: topic['slug'], id: topic['id'] }),
    category_id: num(topic['category_id']),
    tags: tagNames(topic['tags']),
    posts_count: num(topic['posts_count']),
    reply_count: num(topic['reply_count']),
    views: num(topic['views']),
    like_count: num(topic['like_count']),
    excerpt: str(topic['excerpt']),
    created_at: str(topic['created_at']),
    last_posted_at: str(topic['last_posted_at']),
    bumped_at: str(topic['bumped_at']),
    closed: bool(topic['closed']),
    archived: bool(topic['archived']),
    pinned: bool(topic['pinned']),
    visible: bool(topic['visible']),
    archetype: str(topic['archetype']),
    last_poster_username: str(topic['last_poster_username']),
  };
}

function topic({ raw, baseUrl }: { raw: unknown; baseUrl: string }) {
  const value = rec(raw);
  const details = rec(value['details']);
  const firstPost = rec(list(rec(value['post_stream'])['posts'])[0]);
  return {
    ...topicSummary({ raw: value, baseUrl }),
    created_by_username: str(rec(details['created_by'])['username']),
    participant_count: num(value['participant_count']),
    first_post_id: num(firstPost['id']),
    first_post_cooked: str(firstPost['cooked']),
    external_id: str(value['external_id']),
    deleted_at: str(value['deleted_at']),
  };
}

function post({ raw, baseUrl }: { raw: unknown; baseUrl: string }) {
  const value = rec(raw);
  const likeAction = list(value['actions_summary']).map(rec).find((item) => num(item['id']) === 2);
  return {
    id: num(value['id']),
    topic_id: num(value['topic_id']),
    post_number: num(value['post_number']),
    username: str(value['username']),
    name: str(value['name']),
    user_id: num(value['user_id']),
    raw: str(value['raw']),
    cooked: str(value['cooked']),
    topic_slug: str(value['topic_slug']),
    topic_title: str(value['topic_title']),
    url:
      value['topic_id'] === undefined
        ? null
        : `${topicUrl({ baseUrl, slug: value['topic_slug'], id: value['topic_id'] })}/${num(value['post_number']) ?? 1}`,
    reply_to_post_number: num(value['reply_to_post_number']),
    reply_count: num(value['reply_count']),
    like_count:
      num(likeAction?.['count']) ?? num(value['like_count']) ?? (Array.isArray(value['actions_summary']) ? 0 : null),
    version: num(value['version']),
    hidden: bool(value['hidden']),
    created_at: str(value['created_at']),
    updated_at: str(value['updated_at']),
    deleted_at: str(value['deleted_at']),
  };
}

function user({ raw, baseUrl }: { raw: unknown; baseUrl: string }) {
  const value = rec(raw);
  return {
    id: num(value['id']),
    username: str(value['username']),
    name: str(value['name']),
    title: str(value['title']),
    avatar_url: avatar({ baseUrl, template: value['avatar_template'] }),
    trust_level: num(value['trust_level']),
    admin: bool(value['admin']),
    moderator: bool(value['moderator']),
    active: bool(value['active']),
    staged: bool(value['staged']),
    suspended_till: str(value['suspended_till']),
    silenced_till: str(value['silenced_till']),
    created_at: str(value['created_at']),
    last_seen_at: str(value['last_seen_at']),
    last_posted_at: str(value['last_posted_at']),
    post_count: num(value['post_count']),
    badge_count: num(value['badge_count']),
    location: str(value['location']),
    website: str(value['website']),
    bio_raw: str(value['bio_raw']),
  };
}

function adminUser({ raw, baseUrl }: { raw: unknown; baseUrl: string }) {
  const value = rec(raw);
  const singleSignOn = rec(value['single_sign_on_record']);
  return {
    ...user({ raw: value, baseUrl }),
    email: str(value['email']),
    approved: bool(value['approved']),
    ip_address: str(value['ip_address']),
    external_id: str(singleSignOn['external_id']),
  };
}

function category({ raw, baseUrl }: { raw: unknown; baseUrl: string }) {
  const value = rec(raw);
  const slug = str(value['slug']);
  const id = num(value['id']);
  return {
    id,
    name: str(value['name']),
    slug,
    url: id === null || slug === null ? null : `${baseUrl}/c/${encodeURIComponent(slug)}/${id}`,
    color: str(value['color']),
    text_color: str(value['text_color']),
    description: str(value['description_text']) ?? str(value['description']),
    parent_category_id: num(value['parent_category_id']),
    topic_count: num(value['topic_count']),
    post_count: num(value['post_count']),
    position: num(value['position']),
    read_restricted: bool(value['read_restricted']),
  };
}

function group({ raw }: { raw: unknown }) {
  const value = rec(raw);
  return {
    id: num(value['id']),
    name: str(value['name']),
    full_name: str(value['full_name']),
    display_name: str(value['display_name']),
    user_count: num(value['user_count']),
    automatic: bool(value['automatic']),
    visibility_level: num(value['visibility_level']),
    mentionable_level: num(value['mentionable_level']),
    messageable_level: num(value['messageable_level']),
    title: str(value['title']),
    bio_raw: str(value['bio_raw']),
    public_admission: bool(value['public_admission']),
    allow_membership_requests: bool(value['allow_membership_requests']),
  };
}

function groupMember({ raw, baseUrl, owner }: { raw: unknown; baseUrl: string; owner: boolean }) {
  const value = rec(raw);
  return {
    id: num(value['id']),
    username: str(value['username']),
    name: str(value['name']),
    title: str(value['title']),
    avatar_url: avatar({ baseUrl, template: value['avatar_template'] }),
    is_owner: owner,
    added_at: str(value['added_at']),
    last_seen_at: str(value['last_seen_at']),
    last_posted_at: str(value['last_posted_at']),
  };
}

function badge({ raw }: { raw: unknown }) {
  const value = rec(raw);
  return {
    id: num(value['id']),
    name: str(value['name']),
    description: str(value['description']),
    badge_type_id: num(value['badge_type_id']),
    grant_count: num(value['grant_count']),
    enabled: bool(value['enabled']),
    multiple_grant: bool(value['multiple_grant']),
    allow_title: bool(value['allow_title']),
    icon: str(value['icon']),
    image_url: str(value['image_url']),
  };
}

function userBadge({ raw, badges }: { raw: unknown; badges: unknown[] }) {
  const value = rec(raw);
  const badgeId = num(value['badge_id']);
  const matched = rec(badges.map(rec).find((item) => num(item['id']) === badgeId));
  return {
    id: num(value['id']),
    badge_id: badgeId,
    badge_name: str(matched['name']),
    granted_at: str(value['granted_at']),
    granted_by_id: num(value['granted_by_id']),
    post_id: num(value['post_id']),
    topic_id: num(value['topic_id']),
  };
}

function notification({ raw }: { raw: unknown }) {
  const value = rec(raw);
  const data = rec(value['data']);
  return {
    id: num(value['id']),
    notification_type: num(value['notification_type']),
    read: bool(value['read']),
    high_priority: bool(value['high_priority']),
    created_at: str(value['created_at']),
    topic_id: num(value['topic_id']),
    post_number: num(value['post_number']),
    slug: str(value['slug']),
    topic_title: str(value['fancy_title']) ?? str(data['topic_title']),
    display_username: str(data['display_username']) ?? str(data['original_username']),
  };
}

function userAction({ raw }: { raw: unknown }) {
  const value = rec(raw);
  return {
    action_type: num(value['action_type']),
    created_at: str(value['created_at']),
    topic_id: num(value['topic_id']),
    post_id: num(value['post_id']),
    post_number: num(value['post_number']),
    title: str(value['title']),
    excerpt: str(value['excerpt']),
    username: str(value['username']),
    acting_username: str(value['acting_username']),
    category_id: num(value['category_id']),
    slug: str(value['slug']),
  };
}

function invite({ raw }: { raw: unknown }) {
  const value = rec(raw);
  return {
    id: num(value['id']),
    invite_key: str(value['invite_key']),
    link: str(value['link']),
    email: str(value['email']),
    domain: str(value['domain']),
    emailed: bool(value['emailed']),
    max_redemptions_allowed: num(value['max_redemptions_allowed']),
    redemption_count: num(value['redemption_count']),
    expires_at: str(value['expires_at']),
    created_at: str(value['created_at']),
  };
}

function tag({ raw }: { raw: unknown }) {
  const value = rec(raw);
  return {
    id: str(value['id']),
    name: str(value['text']) ?? str(value['name']),
    count: num(value['count']),
  };
}

export const discourseMap = {
  rec,
  str,
  num,
  bool,
  list,
  topicSummary,
  topic,
  post,
  user,
  adminUser,
  category,
  group,
  groupMember,
  badge,
  userBadge,
  notification,
  userAction,
  invite,
  tag,
};
