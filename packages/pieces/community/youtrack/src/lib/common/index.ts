import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';

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

/**
 * Triggers read `auth.props` directly. When no connection is selected on the
 * step, `auth` is undefined and that dereference throws a bare TypeError, which
 * tells the user nothing. Fail with the actual problem instead.
 */
export function requireYoutrackAuth(auth: unknown): {
  baseUrl: string;
  apiToken: string;
} {
  const props = (auth as { props?: { baseUrl?: string; apiToken?: string } })?.props;
  if (!props?.baseUrl || !props?.apiToken) {
    throw new Error(
      'No YouTrack connection selected. Choose a connection on this step before running it.',
    );
  }
  return { baseUrl: props.baseUrl, apiToken: props.apiToken };
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

/**
 * YouTrack requires `customFields` to be an array. The builder's JSON editor
 * starts out as `{}`, which is truthy, so forwarding the raw value makes the API
 * fail with a 500 "IssueCustomFieldMegaProxy cannot be cast to java.util.List".
 * Empty values are omitted; a non-empty non-array is a user mistake worth
 * reporting clearly instead of letting it surface as a Java cast error.
 */
export function normalizeCustomFields(value: unknown): unknown[] | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value : undefined;
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return undefined;
  }
  throw new Error(
    'Custom Fields (JSON) must be an array of field objects, for example: ' +
      '[{ "name": "Priority", "$type": "SingleEnumIssueCustomField", "value": { "name": "Critical" } }]',
  );
}

/**
 * Reduces one custom field value to a scalar. YouTrack returns a different
 * `$type` per field kind: enum/state/version/owned values carry `name`, user
 * values `fullName`/`login`, text values `text`, period values `presentation`
 * (with `minutes`), and simple fields (integer, float, string, date) come back
 * as a bare primitive. Multi-value fields arrive as an array.
 */
function customFieldValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    return value
      .map((entry) => customFieldValue(entry))
      .filter((entry) => entry !== null)
      .join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['name', 'fullName', 'login', 'text', 'presentation']) {
      const candidate = obj[key];
      if (typeof candidate === 'string' && candidate !== '') {
        return candidate;
      }
    }
    if (typeof obj['minutes'] === 'number') {
      return obj['minutes'];
    }
    return JSON.stringify(value);
  }
  return value;
}

/**
 * Flattens an issue the same way as {@link flattenObject}, except `customFields`
 * becomes a `{ fieldName: value }` map instead of being collapsed to a list of
 * field *names* — the generic flattener discards every custom field value,
 * which is where an issue's Priority, State and Assignee live.
 */
export function flattenIssue(
  issue: Record<string, unknown>,
): Record<string, unknown> {
  const { customFields, ...rest } = issue;
  const result = flattenObject(rest);

  const values: Record<string, unknown> = {};
  if (Array.isArray(customFields)) {
    for (const field of customFields as Array<Record<string, unknown>>) {
      const name = field['name'];
      if (typeof name === 'string' && name !== '') {
        values[name] = customFieldValue(field['value']);
      }
    }
  }
  result['customFields'] = values;

  return result;
}

// -----------------------------------------------------------------------------
// Shared Dropdowns
// -----------------------------------------------------------------------------

/**
 * Surfaces the real reason a dropdown could not load instead of a generic
 * message, otherwise a wrong URL and an expired token look identical.
 */
export function dropdownError(prefix: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { disabled: true, options: [], placeholder: prefix + ': ' + message };
}

export const projectDropdown = Property.Dropdown({
  displayName: 'Project',
  description: 'Select the YouTrack project to work with.',
  required: true,
  auth: youtrackAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth.props;
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
    } catch (error) {
      return dropdownError('Failed to load projects', error);
    }
  },
});

export const issueDropdown = Property.Dropdown({
  displayName: 'Issue',
  description: 'Select the issue to work with.',
  required: true,
  auth: youtrackAuth,
  refreshers: ['project'],
  options: async ({ auth, project }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth.props;
    try {
      const queryParams: Record<string, string> = {
        fields: 'id,idReadable,summary',
        '$top': project ? '100' : '50',
      };
      if (project) {
        // The project dropdown yields an internal id (e.g. "0-5"), but YouTrack
        // search syntax only matches a project by name/shortName.
        const projectResponse = await youtrackApiCall<{ shortName: string }>({
          baseUrl, token: apiToken, method: HttpMethod.GET,
          path: '/admin/projects/' + project, queryParams: { fields: 'shortName' },
        });
        queryParams['query'] = 'project: {' + projectResponse.body.shortName + '}';
      }
      const response = await youtrackApiCall<Array<{ id: string; idReadable: string; summary: string }>>({
        baseUrl, token: apiToken, method: HttpMethod.GET, path: '/issues', queryParams,
      });
      if (!response.body || response.body.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: project ? 'No issues found in this project.' : 'No issues found.',
        };
      }
      return {
        disabled: false,
        options: response.body.map((i) => ({
          label: i.idReadable + ': ' + i.summary,
          value: i.id,
        })),
      };
    } catch (error) {
      return dropdownError('Failed to load issues', error);
    }
  },
});

export const tagDropdown = Property.Dropdown({
  displayName: 'Tag',
  description: 'Select a tag to apply to the issue.',
  required: true,
  refreshers: [],
  auth: youtrackAuth,
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth.props;
    try {
      const response = await youtrackApiCall<Array<{ id: string; name: string }>>({
        baseUrl, token: apiToken, method: HttpMethod.GET,
        path: '/tags', queryParams: { fields: 'id,name' },
      });
      if (!response.body || response.body.length === 0) {
        return { disabled: false, options: [], placeholder: 'No tags found. Create one in YouTrack first.' };
      }
      return { disabled: false, options: response.body.map((t) => ({ label: t.name, value: t.id })) };
    } catch (error) {
      return dropdownError('Failed to load tags', error);
    }
  },
});

export const userDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select a YouTrack user.',
  required: true,
  refreshers: [],
  auth: youtrackAuth,
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const { baseUrl, apiToken } = auth.props;
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
    } catch (error) {
      return dropdownError('Failed to load users', error);
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
