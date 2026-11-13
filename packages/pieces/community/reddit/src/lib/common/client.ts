import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

async function request<T>({ auth, method, path, query, form, allowJsonErrors = false }: RequestParams): Promise<T> {
  const isForm = form !== undefined;
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'User-Agent': USER_AGENT,
        ...(isForm ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      queryParams: { raw_json: '1', ...compact({ values: query ?? {} }) },
      body: isForm ? new URLSearchParams(compact({ values: form })).toString() : undefined,
    });
    if (!allowJsonErrors) {
      assertNoJsonErrors({ body: response.body });
    }
    return response.body;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw new Error(describeHttpError({ status: error.response.status, body: error.response.body }));
    }
    throw error;
  }
}

function toFullname({ value, prefix, accept = [prefix] }: { value: string; prefix: ThingPrefix; accept?: ThingPrefix[] }): string {
  const trimmed = value.trim();
  if (!FULLNAME_PATTERN.test(trimmed)) {
    return `${prefix}${trimmed}`;
  }
  if (!accept.some((allowed) => trimmed.startsWith(allowed))) {
    throw new Error(`Expected a ${accept.join(' or ')} fullname, got "${trimmed}".`);
  }
  return trimmed;
}

function requireFullname({ value, label }: { value: string; label: string }): string {
  const trimmed = value.trim();
  if (!FULLNAME_PATTERN.test(trimmed)) {
    throw new Error(`${label} must be a Reddit fullname with its type prefix (t1_ comment, t3_ post, t4_ message), got "${trimmed}".`);
  }
  return trimmed;
}

function toBaseId({ value }: { value: string }): string {
  return value.trim().replace(FULLNAME_PATTERN, '');
}

function cleanSubreddit({ value }: { value: string }): string {
  return value.trim().replace(/^\/?r\//i, '');
}

function cleanUsername({ value }: { value: string }): string {
  return value.trim().replace(/^\/?u(ser)?\//i, '');
}

function toThing({ thing }: { thing: RedditThing }): Record<string, unknown> {
  const fields = FIELDS_BY_KIND[thing.kind];
  if (fields === undefined) {
    return { kind: thing.kind, ...thing.data };
  }
  return { kind: thing.kind, ...pick({ data: thing.data, keys: fields }) };
}

function toListing({ listing }: { listing: RedditListing }) {
  const items = listing.data.children.map((thing) => toThing({ thing }));
  return { items, count: items.length, after: listing.data.after ?? null, before: listing.data.before ?? null };
}

function flattenCommentTree({ children }: { children: RedditThing[] }): { comments: Record<string, unknown>[]; more: Record<string, unknown>[] } {
  return children.reduce<{ comments: Record<string, unknown>[]; more: Record<string, unknown>[] }>(
    (acc, thing) => {
      if (thing.kind === 'more') {
        return { comments: acc.comments, more: [...acc.more, pick({ data: thing.data, keys: MORE_FIELDS })] };
      }
      const replies = thing.data['replies'];
      const nested = isListing(replies) ? flattenCommentTree({ children: replies.data.children }) : { comments: [], more: [] };
      return {
        comments: [...acc.comments, toThing({ thing }), ...nested.comments],
        more: [...acc.more, ...nested.more],
      };
    },
    { comments: [], more: [] },
  );
}

function isListing(value: unknown): value is RedditListing {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return false;
  }
  const data = value.data;
  return typeof data === 'object' && data !== null && 'children' in data && Array.isArray(data.children);
}

function pick({ data, keys }: { data: Record<string, unknown>; keys: readonly string[] }): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, data[key] ?? null]));
}

function compact({ values }: { values: Record<string, string | number | boolean | undefined | null> }): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== null && entry[1] !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function assertNoJsonErrors({ body }: { body: unknown }): void {
  if (typeof body !== 'object' || body === null || !('json' in body)) {
    return;
  }
  const json = body.json;
  if (typeof json !== 'object' || json === null || !('errors' in json) || !Array.isArray(json.errors) || json.errors.length === 0) {
    return;
  }
  const messages = json.errors.map((error: unknown) => (Array.isArray(error) ? error.join(': ') : String(error)));
  throw new Error(`Reddit rejected the request: ${messages.join('; ')}`);
}

function describeHttpError({ status, body }: { status: number; body: unknown }): string {
  const detail = typeof body === 'string' ? body : JSON.stringify(body);
  if (status === 401) {
    return `Reddit returned 401 Unauthorized: the connection's token is invalid or expired. Reconnect your Reddit account. ${detail}`;
  }
  if (status === 403) {
    return `Reddit returned 403 Forbidden: the account lacks permission for this item, or the connection is missing a scope added later (save, report, subscribe, privatemessages, mysubreddits, wikiread) — reconnect your Reddit account to grant it. ${detail}`;
  }
  if (status === 404) {
    return `Reddit returned 404 Not Found: check the id, subreddit or username. ${detail}`;
  }
  if (status === 429) {
    return `Reddit returned 429 Too Many Requests: rate limit reached, retry later. ${detail}`;
  }
  return `Reddit returned ${status}: ${detail}`;
}

const BASE_URL = 'https://oauth.reddit.com';
const USER_AGENT = 'ActivePieces Reddit Client';
const FULLNAME_PATTERN = /^t[1-6]_/;
const POST_FIELDS = [
  'id', 'name', 'title', 'author', 'subreddit', 'subreddit_name_prefixed', 'selftext', 'url', 'permalink', 'domain',
  'score', 'upvote_ratio', 'num_comments', 'num_crossposts', 'created_utc', 'edited', 'is_self', 'over_18', 'spoiler',
  'stickied', 'locked', 'archived', 'link_flair_text', 'link_flair_template_id', 'crosspost_parent',
] as const;
const COMMENT_FIELDS = [
  'id', 'name', 'author', 'body', 'score', 'created_utc', 'edited', 'permalink', 'parent_id', 'link_id', 'link_title',
  'subreddit', 'depth', 'is_submitter', 'stickied', 'distinguished',
] as const;
const SUBREDDIT_FIELDS = [
  'id', 'name', 'display_name', 'display_name_prefixed', 'title', 'public_description', 'subscribers', 'active_user_count',
  'subreddit_type', 'submission_type', 'over18', 'lang', 'created_utc', 'url', 'user_is_subscriber', 'user_is_moderator',
] as const;
const USER_FIELDS = [
  'id', 'name', 'link_karma', 'comment_karma', 'total_karma', 'created_utc', 'is_gold', 'is_mod', 'verified',
  'has_verified_email', 'is_employee', 'icon_img',
] as const;
const MESSAGE_FIELDS = [
  'id', 'name', 'author', 'dest', 'subject', 'body', 'created_utc', 'new', 'was_comment', 'parent_id',
  'first_message_name', 'context', 'subreddit', 'distinguished',
] as const;
const MORE_FIELDS = ['id', 'name', 'parent_id', 'count', 'depth', 'children'] as const;
const FIELDS_BY_KIND: Record<string, readonly string[] | undefined> = {
  t1: COMMENT_FIELDS,
  t2: USER_FIELDS,
  t3: POST_FIELDS,
  t4: MESSAGE_FIELDS,
  t5: SUBREDDIT_FIELDS,
};

export const redditApi = {
  request,
  toFullname,
  requireFullname,
  toBaseId,
  cleanSubreddit,
  cleanUsername,
  toThing,
  toListing,
  flattenCommentTree,
};

type ThingPrefix = 't1_' | 't3_' | 't4_' | 't5_';

type RequestParams = {
  auth: { access_token: string };
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  form?: Record<string, string | number | boolean | undefined | null>;
  allowJsonErrors?: boolean;
};

export type RedditThing = {
  kind: string;
  data: Record<string, unknown>;
};

export type RedditListing = {
  kind?: string;
  data: {
    after?: string | null;
    before?: string | null;
    children: RedditThing[];
  };
};
