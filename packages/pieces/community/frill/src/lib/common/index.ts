import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { frillAuth } from '../../';

const BASE_URL = 'https://api.frill.co/v1';

// ─── Centralized API call ──────────────────────────────────────────

export async function frillApiCall<T extends HttpMessageBody>({
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
  queryParams?: Record<string, string | number | boolean | undefined>;
}): Promise<HttpResponse<T>> {
  const sanitizedQuery: Record<string, string> = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        sanitizedQuery[key] = String(value);
      }
    }
  }

  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams: sanitizedQuery,
    body,
  });
}

// ─── Pagination helper (cursor-based) ─────────────────────────────────

export async function frillPaginatedApiCall<T>({
  token,
  path,
  queryParams,
  limit,
}: {
  token: string;
  path: string;
  queryParams?: Record<string, string | number | boolean | undefined>;
  limit?: number;
}): Promise<T[]> {
  const results: T[] = [];
  const targetLimit = limit && limit > 0 ? limit : 100;
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage && results.length < targetLimit) {
    const pageLimit = Math.min(100, targetLimit - results.length);
    const response = await frillApiCall<{
      data: T[];
      pagination: {
        total: number;
        count: number;
        hasNextPage: boolean;
        startCursor: string;
        endCursor: string;
      };
    }>({
      token,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...queryParams,
        limit: pageLimit,
        after,
      },
    });

    results.push(...response.body.data);
    hasNextPage = response.body.pagination.hasNextPage;
    after = response.body.pagination.endCursor;
  }

  return results;
}

// ─── Flattening helper ───────────────────────────────────────────────

export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}_${key}` : key;

    if (value === null || value === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(value)) {
      result[flatKey] = value
        .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
        .join(', ');
    } else if (typeof value === 'object') {
      Object.assign(result, flattenObject(value as Record<string, unknown>, flatKey));
    } else {
      result[flatKey] = value;
    }
  }

  return result;
}

// ─── Dropdown helpers ───────────────────────────────────────────────

export const frillDropdowns = {
  ideaDropdown: Property.Dropdown({
    displayName: 'Idea',
    description: 'Select the feedback or idea to work with',
    auth: frillAuth,
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await frillApiCall<{
          data: { idx: string; name: string; slug: string }[];
        }>({
          token: auth as string,
          method: HttpMethod.GET,
          path: '/ideas',
          queryParams: { limit: 100 },
        });
        return {
          disabled: false,
          options: response.body.data.map((idea) => ({
            label: `${idea.name} (${idea.slug})`,
            value: idea.idx,
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: 'Failed to load ideas. Check your connection.' };
      }
    },
  }),

  ideaDropdownOptional: Property.Dropdown({
    displayName: 'Idea',
    description: 'Optionally filter comments by a specific idea',
    auth: frillAuth,
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await frillApiCall<{
          data: { idx: string; name: string; slug: string }[];
        }>({
          token: auth as string,
          method: HttpMethod.GET,
          path: '/ideas',
          queryParams: { limit: 100 },
        });
        return {
          disabled: false,
          options: response.body.data.map((idea) => ({
            label: `${idea.name} (${idea.slug})`,
            value: idea.idx,
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: 'Failed to load ideas. Check your connection.' };
      }
    },
  }),

  statusDropdown: Property.Dropdown({
    displayName: 'Status',
    description: 'Select the status for the idea',
    auth: frillAuth,
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await frillApiCall<{
          data: { idx: string; name: string; color: string }[];
        }>({
          token: auth as string,
          method: HttpMethod.GET,
          path: '/statuses',
        });
        return {
          disabled: false,
          options: response.body.data.map((status) => ({
            label: status.name,
            value: status.idx,
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: 'Failed to load statuses. Check your connection.' };
      }
    },
  }),

  topicDropdown: Property.MultiSelectDropdown({
    displayName: 'Topics',
    description: 'Select one or more topics to tag the idea with',
    auth: frillAuth,
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await frillApiCall<{
          data: { idx: string; name: string }[];
        }>({
          token: auth as string,
          method: HttpMethod.GET,
          path: '/topics',
        });
        return {
          disabled: false,
          options: response.body.data.map((topic) => ({
            label: topic.name,
            value: topic.idx,
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: 'Failed to load topics. Check your connection.' };
      }
    },
  }),

  announcementCategoryDropdown: Property.Dropdown({
    displayName: 'Category',
    description: 'Select the announcement category',
    auth: frillAuth,
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await frillApiCall<{
          data: { idx: string; name: string }[];
        }>({
          token: auth as string,
          method: HttpMethod.GET,
          path: '/announcement-categories',
        });
        return {
          disabled: false,
          options: response.body.data.map((cat) => ({
            label: cat.name,
            value: cat.idx,
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: 'Failed to load categories. Check your connection.' };
      }
    },
  }),

  followerDropdown: Property.Dropdown({
    displayName: 'Follower (User)',
    description: 'Select a follower to update',
    auth: frillAuth,
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await frillApiCall<{
          data: { idx: string; name: string; email: string }[];
        }>({
          token: auth as string,
          method: HttpMethod.GET,
          path: '/followers',
          queryParams: { limit: 100 },
        });
        return {
          disabled: false,
          options: response.body.data.map((follower) => ({
            label: `${follower.name} (${follower.email})`,
            value: follower.idx,
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: 'Failed to load followers. Check your connection.' };
      }
    },
  }),
};
