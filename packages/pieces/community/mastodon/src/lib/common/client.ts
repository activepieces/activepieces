import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

const RATE_LIMIT_GUIDANCE =
  'Mastodon allows about 300 requests per 5 minutes per account by default (media uploads 30 per 30 minutes; status deletes and unboosts 30 per 30 minutes combined), and instances can tune these limits. Wait a few minutes before retrying.';

const SCOPE_GUIDANCE =
  'In Mastodon, open Preferences > Development, select the application, tick the top-level read and write scopes and save. Saving regenerates the access token, so paste the new token into this Activepieces connection.';

const MIN_SCHEDULE_AHEAD_MS = 5 * 60 * 1000;
const SCHEDULE_SAFETY_MARGIN_MS = 60 * 1000;

const NOTIFICATION_TYPE_OPTIONS = [
  { label: 'Mention', value: 'mention' },
  { label: 'New post from an account you enabled notifications for', value: 'status' },
  { label: 'Boost', value: 'reblog' },
  { label: 'Follow', value: 'follow' },
  { label: 'Follow request', value: 'follow_request' },
  { label: 'Favourite', value: 'favourite' },
  { label: 'Poll ended', value: 'poll' },
  { label: 'Boosted post edited', value: 'update' },
  { label: 'Quote', value: 'quote' },
  { label: 'Quoted post edited', value: 'quoted_update' },
  { label: 'Relationships severed', value: 'severed_relationships' },
  { label: 'Moderation warning', value: 'moderation_warning' },
  { label: 'Admin: new sign-up', value: 'admin.sign_up' },
  { label: 'Admin: new report', value: 'admin.report' },
];

function getBaseUrl(auth: MastodonConnection): string {
  return auth.base_url.replace(/\/$/, '');
}

function buildQueryString(query: MastodonQuery | undefined): string {
  if (query === undefined) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(`${key}[]`, item);
      }
      continue;
    }
    params.append(key, String(value));
  }
  const queryString = params.toString();
  return queryString === '' ? '' : `?${queryString}`;
}

function extractVendorError(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim() !== '') {
    return body;
  }
  if (typeof body === 'object' && body !== null) {
    if ('error' in body && typeof body.error === 'string') {
      return body.error;
    }
    if ('error_description' in body && typeof body.error_description === 'string') {
      return body.error_description;
    }
  }
  return undefined;
}

function describeFailure({
  status,
  body,
  operation,
  scope,
  minVersion,
  notFoundMessage,
}: {
  status: number;
  body: unknown;
  operation: string;
  scope?: string;
  minVersion?: string;
  notFoundMessage?: string;
}): string {
  const vendorError = extractVendorError(body);
  const vendorSuffix = vendorError === undefined ? '' : ` Mastodon said: "${vendorError}".`;
  switch (status) {
    case 401:
      return `Mastodon rejected the access token while running ${operation}: it is invalid or has been revoked. Create a new access token under Preferences > Development and update the connection.${vendorSuffix}`;
    case 403: {
      const isScopeError =
        vendorError === undefined || /authorized scopes|scope/i.test(vendorError);
      if (isScopeError && scope !== undefined) {
        return `Mastodon refused ${operation} because the connection's access token lacks the "${scope}" scope.${vendorSuffix} ${SCOPE_GUIDANCE}`;
      }
      return `Mastodon refused ${operation}: the connected account is not allowed to perform this action on this resource.${vendorSuffix}`;
    }
    case 404: {
      if (notFoundMessage !== undefined) {
        return `${notFoundMessage}${vendorSuffix}`;
      }
      const versionHint =
        minVersion === undefined
          ? ''
          : ` This endpoint requires Mastodon ${minVersion} or later; use Get Instance Info to check the server version.`;
      return `Mastodon could not find the resource for ${operation}. It may not exist, may not be visible to the connected account, or the server may not support this endpoint.${versionHint}${vendorSuffix}`;
    }
    case 422:
      return `Mastodon rejected ${operation}: ${vendorError ?? 'the request was invalid'}.`;
    case 429:
      return `Mastodon rate limit reached while running ${operation}. ${RATE_LIMIT_GUIDANCE}`;
    default:
      return `Mastodon returned HTTP ${status} for ${operation}.${vendorSuffix}`;
  }
}

async function sendRequest<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
  operation,
  scope,
  minVersion,
  notFoundMessage,
}: MastodonRequestParams): Promise<HttpResponse<T>> {
  try {
    return await httpClient.sendRequest<T>({
      method,
      url: `${getBaseUrl(auth)}${path}${buildQueryString(query)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers,
      body,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      throw new MastodonApiError({
        status,
        message: describeFailure({
          status,
          body: error.response.body,
          operation,
          scope,
          minVersion,
          notFoundMessage,
        }),
      });
    }
    throw error;
  }
}

async function request<T>(params: MastodonRequestParams): Promise<T> {
  const response = await sendRequest<T>(params);
  return response.body;
}

function readLinkHeader(headers: HttpHeaders | undefined): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== 'link' || value === undefined) {
      continue;
    }
    return Array.isArray(value) ? value.join(', ') : value;
  }
  return undefined;
}

function parseLinkHeader(headers: HttpHeaders | undefined): MastodonCursors {
  const cursors: MastodonCursors = {
    next_max_id: null,
    prev_min_id: null,
    prev_since_id: null,
  };
  const linkHeader = readLinkHeader(headers);
  if (linkHeader === undefined) {
    return cursors;
  }
  const linkPattern = /<([^>]+)>\s*;\s*rel="([^"]+)"/g;
  for (const match of linkHeader.matchAll(linkPattern)) {
    const url = safeParseUrl(match[1]);
    if (url === null) {
      continue;
    }
    const rel = match[2];
    if (rel === 'next') {
      cursors.next_max_id = url.searchParams.get('max_id');
    }
    if (rel === 'prev') {
      cursors.prev_min_id = url.searchParams.get('min_id');
      cursors.prev_since_id = url.searchParams.get('since_id');
    }
  }
  return cursors;
}

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

async function requestPage<T>(params: MastodonRequestParams): Promise<MastodonPage<T>> {
  const response = await sendRequest<T[]>(params);
  const items = Array.isArray(response.body) ? response.body : [];
  return {
    items,
    count: items.length,
    ...parseLinkHeader(response.headers),
  };
}

function toStringArray(value: unknown[] | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  const items = value
    .filter((item) => typeof item === 'string' || typeof item === 'number')
    .map((item) => String(item).trim())
    .filter((item) => item !== '');
  return items.length === 0 ? undefined : items;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function optionalBooleanProp({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown<boolean>({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

function limitProp({
  noun,
  defaultLimit,
  maxLimit,
}: {
  noun: string;
  defaultLimit: number;
  maxLimit: number;
}) {
  return Property.Number({
    displayName: 'Limit',
    description: `Maximum number of ${noun} to return in this page. Defaults to ${defaultLimit}, maximum ${maxLimit}.`,
    required: false,
  });
}

function notificationTypesProp({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticMultiSelectDropdown({
    displayName,
    description,
    required: false,
    options: { disabled: false, options: NOTIFICATION_TYPE_OPTIONS },
  });
}

function maxIdProp() {
  return Property.ShortText({
    displayName: 'Max ID (older page)',
    description:
      'Cursor for the next (older) page. Pass the `next_max_id` value from the previous page of this same action. Leave empty for the newest page.',
    required: false,
  });
}

function sinceIdProp() {
  return Property.ShortText({
    displayName: 'Since ID (newer results)',
    description:
      'Cursor for newer results. Pass the `prev_since_id` value from a previous page of this same action to page back towards newer items.',
    required: false,
  });
}

function minIdProp() {
  return Property.ShortText({
    displayName: 'Min ID (newer page)',
    description:
      'Cursor for the page immediately newer than a previous page. Pass the `prev_min_id` value from a previous page of this same action.',
    required: false,
  });
}

function assertScheduledAt(scheduledAt: string): string {
  const scheduledTime = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledTime)) {
    throw new Error(
      `Scheduled At must be an ISO 8601 date-time such as 2026-10-01T09:30:00Z, got "${scheduledAt}".`
    );
  }
  if (scheduledTime - Date.now() < MIN_SCHEDULE_AHEAD_MS + SCHEDULE_SAFETY_MARGIN_MS) {
    throw new Error(
      'Scheduled At must be at least 6 minutes in the future; Mastodon rejects anything under 5 minutes, and the extra minute absorbs clock skew.'
    );
  }
  return new Date(scheduledTime).toISOString();
}

function buildComposeBody({
  status,
  visibility,
  inReplyToId,
  spoilerText,
  sensitive,
  language,
  mediaIds,
  pollOptions,
  pollExpiresIn,
  pollMultiple,
}: ComposeInput): Record<string, unknown> {
  const hasMedia = mediaIds !== undefined && mediaIds.length > 0;
  const hasPoll = pollOptions !== undefined && pollOptions.length > 0;
  const hasText = status !== undefined && status.trim() !== '';
  if (!hasText && !hasMedia) {
    throw new Error('Provide the status text, or at least one Media ID to post media without text.');
  }
  if (hasMedia && hasPoll) {
    throw new Error(
      'A status cannot have both media and a poll. Remove the Media IDs or the Poll Options.'
    );
  }
  if (hasPoll && (pollExpiresIn === undefined || pollExpiresIn === null)) {
    throw new Error('Poll Duration (seconds) is required when Poll Options are provided.');
  }
  const hasPollSettings =
    (pollExpiresIn !== undefined && pollExpiresIn !== null) || pollMultiple !== undefined;
  if (!hasPoll && hasPollSettings) {
    throw new Error('Poll Duration and Allow Multiple Choices only apply when Poll Options are provided.');
  }
  return {
    ...(hasText ? { status } : {}),
    ...(hasValue(visibility) ? { visibility } : {}),
    ...(hasValue(inReplyToId) ? { in_reply_to_id: inReplyToId } : {}),
    ...(hasValue(spoilerText) ? { spoiler_text: spoilerText } : {}),
    ...(sensitive !== undefined ? { sensitive } : {}),
    ...(hasValue(language) ? { language } : {}),
    ...(hasMedia ? { media_ids: mediaIds } : {}),
    ...(hasPoll
      ? {
          poll: {
            options: pollOptions,
            expires_in: pollExpiresIn,
            ...(pollMultiple !== undefined ? { multiple: pollMultiple } : {}),
          },
        }
      : {}),
  };
}

function composeProps() {
  return {
    status: Property.LongText({
      displayName: 'Status Text',
      description:
        'The text of the post. Mentions (@user@domain), hashtags and links are parsed by Mastodon. Required unless Media IDs are provided. Use Get Instance Info to read the server character limit (500 by default).',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Who can see the post. Leave empty to use the account default posting privacy.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted (public, hidden from public timelines)', value: 'unlisted' },
          { label: 'Followers only', value: 'private' },
          { label: 'Direct (mentioned accounts only)', value: 'direct' },
        ],
      },
    }),
    in_reply_to_id: Property.ShortText({
      displayName: 'In Reply To (Status ID)',
      description:
        'Local ID of the status to reply to, for example 109372843234737004. Obtain it from Get Status, a timeline or Search (with resolve for remote URLs).',
      required: false,
    }),
    spoiler_text: Property.ShortText({
      displayName: 'Content Warning',
      description: 'Optional content warning shown before the post text.',
      required: false,
    }),
    sensitive: optionalBooleanProp({
      displayName: 'Mark Media as Sensitive',
      description: 'Whether attached media should be hidden behind a sensitive-content warning. Leave empty for the account default.',
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'ISO 639-1 two-letter language code of the post, for example en or de.',
      required: false,
    }),
    media_ids: Property.Array({
      displayName: 'Media IDs',
      description:
        'IDs of media returned by Upload Media, one per item (up to the server limit, 4 by default). Cannot be combined with a poll.',
      required: false,
    }),
    poll_options: Property.Array({
      displayName: 'Poll Options',
      description:
        'Answer choices for a poll, one per item (2 to 4 on most servers). Cannot be combined with media.',
      required: false,
    }),
    poll_expires_in: Property.Number({
      displayName: 'Poll Duration (seconds)',
      description:
        'How long the poll stays open, in seconds. Mastodon accepts 300 (5 minutes) to 2629746 (1 month). Required with Poll Options.',
      required: false,
    }),
    poll_multiple: optionalBooleanProp({
      displayName: 'Allow Multiple Choices',
      description: 'Whether voters may pick more than one option. Leave empty for single choice.',
    }),
  };
}

export class MastodonApiError extends Error {
  public readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'MastodonApiError';
    this.status = status;
  }
}

export const mastodonClient = { sendRequest, request, requestPage };

export const mastodonProps = {
  optionalBoolean: optionalBooleanProp,
  limit: limitProp,
  notificationTypes: notificationTypesProp,
  maxId: maxIdProp,
  sinceId: sinceIdProp,
  minId: minIdProp,
  compose: composeProps,
};

export const mastodonUtils = {
  toStringArray,
  hasValue,
  assertScheduledAt,
  buildComposeBody,
};

export type MastodonConnection = {
  base_url: string;
  access_token: string;
};

export type MastodonQuery = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export type MastodonRequestParams = {
  auth: MastodonConnection;
  method: HttpMethod;
  path: string;
  operation: string;
  scope?: string;
  minVersion?: string;
  notFoundMessage?: string;
  query?: MastodonQuery;
  body?: unknown;
  headers?: Record<string, string>;
};

export type MastodonCursors = {
  next_max_id: string | null;
  prev_min_id: string | null;
  prev_since_id: string | null;
};

export type MastodonPage<T> = MastodonCursors & {
  items: T[];
  count: number;
};

export type MastodonEntity = Record<string, unknown>;

export type ComposeInput = {
  status?: string;
  visibility?: string;
  inReplyToId?: string;
  spoilerText?: string;
  sensitive?: boolean;
  language?: string;
  mediaIds?: string[];
  pollOptions?: string[];
  pollExpiresIn?: number | null;
  pollMultiple?: boolean;
};
