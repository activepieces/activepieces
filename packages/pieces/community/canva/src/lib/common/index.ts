import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const CANVA_BASE_URL = 'https://api.canva.com/rest/v1';

export async function canvaApiRequest<T>(
  accessToken: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${CANVA_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });
  return response.body;
}

export async function listDesignsForDropdown(
  auth: OAuth2PropertyValue,
  query?: string,
): Promise<Array<{ label: string; value: string }>> {
  const params = new URLSearchParams({ sort_by: 'modified_descending' });
  if (query?.trim()) params.set('query', query.trim());

  const response = await httpClient.sendRequest<{ items?: Array<{ id: string; title?: string }> }>({
    method: HttpMethod.GET,
    url: `${CANVA_BASE_URL}/designs?${params.toString()}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
  });

  return (response.body.items ?? []).map((d) => ({
    label: d.title ?? d.id,
    value: d.id,
  }));
}

export async function listFoldersForDropdown(
  auth: OAuth2PropertyValue,
): Promise<Array<{ label: string; value: string }>> {
  const result: Array<{ label: string; value: string }> = [
    { label: 'Root (Projects)', value: 'root' },
  ];

  try {
    const response = await httpClient.sendRequest<{
      items?: Array<{ type: string; folder?: { id: string; name: string } }>;
    }>({
      method: HttpMethod.GET,
      url: `${CANVA_BASE_URL}/folders/root/items?item_types=folder`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    for (const item of response.body.items ?? []) {
      if (item.type === 'folder' && item.folder) {
        result.push({ label: item.folder.name, value: item.folder.id });
      }
    }
  } catch {
    // Return root only on error
  }

  return result;
}
