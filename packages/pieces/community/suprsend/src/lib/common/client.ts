import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { SUPRSEND_API_BASE_URL, suprsendAuth, suprsendHeaders } from '../auth';

// Request shapes match the SuprSend Zapier, Make and n8n apps (docs.suprsend.com/reference).

export async function suprsendApiCall(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
}): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method: params.method,
    url: `${SUPRSEND_API_BASE_URL}${params.path}`,
    headers: suprsendHeaders(params.apiKey),
    queryParams: params.query,
    body: params.body,
  });
  return response.body;
}

export function splitList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
  return items.length > 0 ? items : undefined;
}

export const listDropdown = Property.Dropdown({
  auth: suprsendAuth,
  displayName: 'List',
  description: 'The SuprSend list to add the user to.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your SuprSend account first',
      };
    }
    // ponytail: first 100 lists only; add paging if workspaces outgrow it
    const body = (await suprsendApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/subscriber_list/',
      query: { limit: '100' },
    })) as { results?: { list_id: string; list_name?: string; is_readonly?: boolean }[] };
    // Read-only lists (like All Subscribers) reject added users
    const lists = (body.results ?? []).filter((list) => !list.is_readonly);
    return {
      disabled: false,
      options: lists.map((list) => ({
        label: list.list_name ? `${list.list_name} (${list.list_id})` : list.list_id,
        value: list.list_id,
      })),
      placeholder: lists.length === 0 ? 'No lists found in this workspace' : undefined,
    };
  },
});
