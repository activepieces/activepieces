import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../../';

const API_PATH = '/api';

export async function youtrackApiCall<T extends HttpMessageBody>({
  baseUrl,
  token,
  method,
  path,
  body,
  queryParams,
  headers,
}: {
  baseUrl: string;
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return await httpClient.sendRequest<T>({
    method,
    url: cleanBase + API_PATH + path,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(headers ?? {}),
    },
    queryParams,
    body,
  });
}

export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$type') continue;
    const flatKey = prefix ? prefix + '_' + key : key;

    if (value === null || value === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result[flatKey] = null;
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        result[flatKey] = value
          .map((v) => {
            if (typeof v === 'object' && v !== null && 'name' in v) {
              return (v as Record<string, unknown>)['name'] as string;
            }
            return JSON.stringify(v);
          })
          .join(', ');
      } else {
        result[flatKey] = value.join(', ');
      }
    } else if (typeof value === 'object') {
      Object.assign(
        result,
        flattenObject(value as Record<string, unknown>, flatKey),
      );
    } else {
      result[flatKey] = value;
    }
  }

  return result;
}

// -----------------------------------------------------------------------------
// Shared Dropdowns
// -----------------------------------------------------------------------------

export const projectDropdown = Property.Dropdown({
  displayName: 'Project',
  description: 'Select the YouTrack project to work with.',
  required: true,
  auth:youtrackAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth as unknown as { baseUrl: string; apiToken: string };
    try {
      const response = await youtrackApiCall<Array<{ id: string; name: string; shortName: string }>>({
        baseUrl, token: apiToken, method: HttpMethod.GET,
        path: '/admin/projects', queryParams: { fields: 'id,name,shortName' },
      });
      if (!response.body || response.body.length === 0) {
        return { disabled: false, options: [], placeholder: 'No projects found. Create one in YouTrack first.' };
      }
      return {
        disabled: false,
        options: response.body.map((p) => ({
          label: p.name + ' (' + p.shortName + ')',
          value: p.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load projects. Check your connection.' };
    }
  },
});

export const issueDropdown = Property.Dropdown({
  displayName: 'Issue',
  description: 'Select the issue to work with.',
  required: true,
  auth:youtrackAuth,
  refreshers: ['project'],
  options: async ({ auth, project }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth as unknown as { baseUrl: string; apiToken: string };
    if (!project) {
      try {
        const response = await youtrackApiCall<Array<{ id: string; idReadable: string; summary: string }>>({
          baseUrl, token: apiToken, method: HttpMethod.GET, path: '/issues',
          queryParams: { fields: 'id,idReadable,summary', '$top': '50' },
        });
        if (!response.body || response.body.length === 0) {
          return { disabled: false, options: [], placeholder: 'No issues found.' };
        }
        return {
          disabled: false,
          options: response.body.map((i) => ({
            label: i.idReadable + ': ' + i.summary,
            value: i.id,
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load issues. Check your connection.' };
      }
    }
    try {
      const response = await youtrackApiCall<Array<{ id: string; idReadable: string; summary: string }>>({
        baseUrl, token: apiToken, method: HttpMethod.GET, path: '/issues',
        queryParams: { fields: 'id,idReadable,summary', query: 'project: {' + project + '}', '$top': '100' },
      });
      if (!response.body || response.body.length === 0) {
        return { disabled: false, options: [], placeholder: 'No issues found in this project.' };
      }
      return {
        disabled: false,
        options: response.body.map((i) => ({
          label: i.idReadable + ': ' + i.summary,
          value: i.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load issues. Check your connection.' };
    }
  },
});

export const tagDropdown = Property.Dropdown({
  displayName: 'Tag',
  description: 'Select a tag to apply to the issue.',
  required: true,
  refreshers: [],
  auth:youtrackAuth,
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth as unknown as { baseUrl: string; apiToken: string };
    try {
      const response = await youtrackApiCall<Array<{ id: string; name: string }>>({
        baseUrl, token: apiToken, method: HttpMethod.GET,
        path: '/tags', queryParams: { fields: 'id,name' },
      });
      if (!response.body || response.body.length === 0) {
        return { disabled: false, options: [], placeholder: 'No tags found. Create one in YouTrack first.' };
      }
      return { disabled: false, options: response.body.map((t) => ({ label: t.name, value: t.id })) };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load tags. Check your connection.' };
    }
  },
});

export const userDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select a YouTrack user.',
  required: true,
  refreshers: [],
  auth:youtrackAuth,
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth as unknown as { baseUrl: string; apiToken: string };
    try {
      const response = await youtrackApiCall<Array<{ id: string; name: string; login: string }>>({
        baseUrl, token: apiToken, method: HttpMethod.GET,
        path: '/users', queryParams: { fields: 'id,name,login', '$top': '200' },
      });
      if (!response.body || response.body.length === 0) {
        return { disabled: false, options: [], placeholder: 'No users found.' };
      }
      return {
        disabled: false,
        options: response.body.map((u) => ({
          label: u.name + ' (' + u.login + ')',
          value: u.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load users. Check your connection.' };
    }
  },
});

// -----------------------------------------------------------------------------
// Standard issue fields string
// -----------------------------------------------------------------------------

export const ISSUE_FIELDS =
  'id,idReadable,summary,description,created,updated,resolved,' +
  'project(id,name,shortName),' +
  'reporter(id,name,login),' +
  'commentsCount,votes,' +
  'customFields(id,name,' +
  'projectCustomField(field(id,name)),' +
  'value(id,name,login,fullName,text,minutes,presentation,isResolved))';
