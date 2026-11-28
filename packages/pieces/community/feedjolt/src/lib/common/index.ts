import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { feedjoltAuth } from '../auth';

const BASE_URL = 'https://api.feedjolt.com/api/v1';

async function apiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined | null>;
}): Promise<HttpResponse<T>> {
  const sanitizedQuery: Record<string, string> = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== '') {
        sanitizedQuery[key] = String(value);
      }
    }
  }

  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams: sanitizedQuery,
    body,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function postBodyText(body: unknown): string | null {
  if (typeof body === 'string') {
    return body;
  }
  if (!isRecord(body)) {
    return null;
  }
  const markdown = body['markdown'];
  if (typeof markdown === 'string') {
    return markdown;
  }
  const text = body['text'];
  if (typeof text === 'string') {
    return text;
  }
  return JSON.stringify(body);
}

function tagNames(tags: unknown): string | null {
  if (!Array.isArray(tags)) {
    return null;
  }
  const names = tags
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag;
      }
      if (isRecord(tag) && typeof tag['name'] === 'string') {
        return tag['name'];
      }
      return null;
    })
    .filter((name): name is string => name !== null);
  return names.length > 0 ? names.join(', ') : null;
}

function flattenWorkspace(workspace: Record<string, unknown>): Record<string, unknown> {
  return {
    id: asString(workspace['id']),
    name: asString(workspace['name']),
    slug: asString(workspace['slug']),
    logo_url: asString(workspace['logo_url']),
    favicon_url: asString(workspace['favicon_url']),
    data_region: asString(workspace['data_region']),
    is_active: asBoolean(workspace['is_active']),
    created_at: asString(workspace['created_at']),
    trial_started: asBoolean(workspace['trial_started']),
    email_intake_enabled: asBoolean(workspace['email_intake_enabled']),
    email_intake_address: asString(workspace['email_intake_address']),
    email_intake_default_board_id: asString(workspace['email_intake_default_board_id']),
  };
}

function flattenBoard(board: Record<string, unknown>): Record<string, unknown> {
  return {
    id: asString(board['id']),
    workspace_id: asString(board['workspace_id']),
    title: asString(board['title']),
    description: asString(board['description']),
    slug: asString(board['slug']),
    icon: asString(board['icon']),
    visibility: asString(board['visibility']),
    votes_enabled: asBoolean(board['votes_enabled']),
    moderation_enabled: asBoolean(board['moderation_enabled']),
    notify_admins_on_new_post: asBoolean(board['notify_admins_on_new_post']),
    pinned_post_id: asString(board['pinned_post_id']),
    archived: asBoolean(board['archived']),
    sort_order: asNumber(board['sort_order']),
    created_at: asString(board['created_at']),
    updated_at: asString(board['updated_at']),
  };
}

function flattenPost(post: Record<string, unknown>): Record<string, unknown> {
  const version = isRecord(post['version']) ? post['version'] : undefined;
  return {
    id: asString(post['id']),
    workspace_id: asString(post['workspace_id']),
    board_id: asString(post['board_id']),
    title: asString(post['title']),
    body: postBodyText(post['body']),
    status_id: asString(post['status_id']),
    author_type: asString(post['author_type']),
    author_id: asString(post['author_id']),
    author_name: asString(post['author_name']),
    author_email: asString(post['author_email']),
    owner_admin_id: asString(post['owner_admin_id']),
    owner_name: asString(post['owner_name']),
    owner_email: asString(post['owner_email']),
    is_draft: asBoolean(post['is_draft']),
    is_internal: asBoolean(post['is_internal']),
    vote_count: asNumber(post['vote_count']),
    weighted_score: asNumber(post['weighted_score']),
    comment_count: asNumber(post['comment_count']),
    is_spam: asBoolean(post['is_spam']),
    is_incognito: asBoolean(post['is_incognito']),
    merged_into_id: asString(post['merged_into_id']),
    tags: tagNames(post['tags']),
    version_id: asString(post['version_id']),
    version_name: version ? asString(version['name']) : null,
    sentiment: asString(post['sentiment']),
    has_linear_issue: asBoolean(post['has_linear_issue']),
    created_at: asString(post['created_at']),
    updated_at: asString(post['updated_at']),
  };
}

function flattenChangelogEntry(entry: Record<string, unknown>): Record<string, unknown> {
  const version = isRecord(entry['version']) ? entry['version'] : undefined;
  const linkedPostIds = Array.isArray(entry['linked_post_ids'])
    ? entry['linked_post_ids'].map((id) => String(id)).join(', ')
    : null;
  return {
    id: asString(entry['id']),
    workspace_id: asString(entry['workspace_id']),
    title: asString(entry['title']),
    body: postBodyText(entry['body']),
    status: asString(entry['status']),
    published_at: asString(entry['published_at']),
    scheduled_at: asString(entry['scheduled_at']),
    author_id: asString(entry['author_id']),
    linked_post_ids: linkedPostIds,
    version_id: version ? asString(version['id']) : asString(entry['version_id']),
    version_name: version ? asString(version['name']) : null,
    created_at: asString(entry['created_at']),
    updated_at: asString(entry['updated_at']),
  };
}

function flattenRoadmapRows(roadmap: Record<string, unknown>): Record<string, unknown>[] {
  const columns = Array.isArray(roadmap['columns']) ? roadmap['columns'] : [];
  const rows: Record<string, unknown>[] = [];
  for (const column of columns) {
    if (!isRecord(column)) {
      continue;
    }
    const status = isRecord(column['status']) ? column['status'] : {};
    const posts = Array.isArray(column['posts']) ? column['posts'] : [];
    if (posts.length === 0) {
      rows.push({
        status_id: asString(status['id']),
        status_name: asString(status['name']),
        status_color: asString(status['color']),
        id: null,
        title: null,
        body: null,
        board_id: null,
        created_at: null,
      });
      continue;
    }
    for (const post of posts) {
      if (!isRecord(post)) {
        continue;
      }
      rows.push({
        status_id: asString(status['id']),
        status_name: asString(status['name']),
        status_color: asString(status['color']),
        ...flattenPost(post),
      });
    }
  }
  return rows;
}

function parseList(body: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.filter(isRecord);
  }
  if (!isRecord(body)) {
    return [];
  }
  for (const key of keys) {
    const value = body[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

export const feedjoltCommon = {
  baseUrl: BASE_URL,
  apiCall,
  isRecord,
  flattenWorkspace,
  flattenBoard,
  flattenPost,
  flattenChangelogEntry,
  flattenRoadmapRows,
  parseList,
  workspaceDropdown: Property.Dropdown({
    displayName: 'Workspace',
    description: 'Select the Feedjolt workspace. The API key must belong to this workspace.',
    auth: feedjoltAuth,
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Feedjolt account first' };
      }
      try {
        const response = await apiCall<HttpMessageBody>({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: '/workspaces',
        });
        const workspaces = parseList(response.body, ['workspaces', 'data', 'items']);
        return {
          disabled: false,
          options: workspaces.flatMap((workspace) => {
            const slug = asString(workspace['slug']);
            if (!slug) {
              return [];
            }
            const name = asString(workspace['name']);
            return [{ label: name ? `${name} (${slug})` : slug, value: slug }];
          }),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load workspaces. Check your API key.' };
      }
    },
  }),
  boardSlugDropdown: Property.Dropdown({
    displayName: 'Board',
    description: 'Select the feedback board to create the post on.',
    auth: feedjoltAuth,
    refreshers: ['workspaceSlug'],
    required: true,
    options: async ({ auth, workspaceSlug }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Feedjolt account first' };
      }
      if (typeof workspaceSlug !== 'string' || workspaceSlug.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a workspace first' };
      }
      try {
        const response = await apiCall<HttpMessageBody>({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: `/workspaces/${encodeURIComponent(workspaceSlug)}/boards`,
        });
        const boards = parseList(response.body, ['boards', 'data', 'items']);
        return {
          disabled: false,
          options: boards.flatMap((board) => {
            const slug = asString(board['slug']);
            if (!slug) {
              return [];
            }
            return [{ label: asString(board['title']) ?? slug, value: slug }];
          }),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load boards. Check your connection.' };
      }
    },
  }),
  boardIdDropdown: Property.Dropdown({
    displayName: 'Board',
    description: 'Optionally limit results to one feedback board.',
    auth: feedjoltAuth,
    refreshers: ['workspaceSlug'],
    required: false,
    options: async ({ auth, workspaceSlug }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Feedjolt account first' };
      }
      if (typeof workspaceSlug !== 'string' || workspaceSlug.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a workspace first' };
      }
      try {
        const response = await apiCall<HttpMessageBody>({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: `/workspaces/${encodeURIComponent(workspaceSlug)}/boards`,
        });
        const boards = parseList(response.body, ['boards', 'data', 'items']);
        return {
          disabled: false,
          options: boards.flatMap((board) => {
            const id = asString(board['id']);
            if (!id) {
              return [];
            }
            return [{ label: asString(board['title']) ?? asString(board['slug']) ?? id, value: id }];
          }),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load boards. Check your connection.' };
      }
    },
  }),
  postDropdown: Property.Dropdown({
    displayName: 'Post',
    description: 'Select a feedback post from the workspace.',
    auth: feedjoltAuth,
    refreshers: ['workspaceSlug'],
    required: true,
    options: async ({ auth, workspaceSlug }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Feedjolt account first' };
      }
      if (typeof workspaceSlug !== 'string' || workspaceSlug.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a workspace first' };
      }
      try {
        const response = await apiCall<HttpMessageBody>({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: `/workspaces/${encodeURIComponent(workspaceSlug)}/posts`,
          queryParams: { page_size: 100, sort_by: 'newest' },
        });
        const posts = parseList(response.body, ['posts', 'data', 'items', 'results']);
        return {
          disabled: false,
          options: posts.flatMap((post) => {
            const id = asString(post['id']);
            if (!id) {
              return [];
            }
            return [{ label: asString(post['title']) ?? id, value: id }];
          }),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load posts. Check your connection.' };
      }
    },
  }),
  statusDropdown: Property.Dropdown({
    displayName: 'Status',
    description: 'Select the status to apply to the post.',
    auth: feedjoltAuth,
    refreshers: ['workspaceSlug'],
    required: true,
    options: async ({ auth, workspaceSlug }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Feedjolt account first' };
      }
      if (typeof workspaceSlug !== 'string' || workspaceSlug.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a workspace first' };
      }
      try {
        const response = await apiCall<HttpMessageBody>({
          token: auth.secret_text,
          method: HttpMethod.GET,
          path: `/workspaces/${encodeURIComponent(workspaceSlug)}/statuses`,
        });
        const statuses = parseList(response.body, ['statuses', 'data', 'items']);
        return {
          disabled: false,
          options: statuses.flatMap((status) => {
            const id = asString(status['id']);
            if (!id) {
              return [];
            }
            return [{ label: asString(status['name']) ?? id, value: id }];
          }),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load statuses. Check your connection.' };
      }
    },
  }),
};
