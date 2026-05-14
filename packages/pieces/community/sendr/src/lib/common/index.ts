import { httpClient, HttpMethod, AuthenticationType, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.sendr.io/api/v1';

export async function sendrApiCall<T extends HttpMessageBody>({
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
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

// Helper to flatten nested API responses into flat keys with underscores
export function flattenObject(
  obj: Record<string, unknown> | null | undefined,
  prefix = '',
): Record<string, unknown> {
  if (obj == null) return {};
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

// Reusable dropdown: Sheets
export const sheetDropdown = Property.Dropdown<string>({
  displayName: 'Sheet',
  description: 'Select the contact list (sheet) to use.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your Sendr account first' };
    }
    try {
      const response = await sendrApiCall<{ items: { id: string; name?: string; campaignId?: string; createdAt?: string }[] }>({
        token: auth as string,
        method: HttpMethod.GET,
        path: '/sheet',
      });
      const items = response.body?.items ?? [];
      return {
        disabled: false,
        options: items.map((s) => ({
          label: s.name ? `${s.name} (${s.id})` : s.id,
          value: s.id,
        })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: 'Failed to load sheets. Check your connection.' };
    }
  },
});

// Reusable dropdown: Campaigns
export const campaignDropdown = Property.Dropdown<string>({
  displayName: 'Campaign',
  description: 'Select the campaign.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your Sendr account first' };
    }
    try {
      const response = await sendrApiCall<{ items: { id: string; name?: string; status?: string }[] }>({
        token: auth as string,
        method: HttpMethod.GET,
        path: '/campaigns',
        queryParams: { limit: '200' },
      });
      const items = response.body?.items ?? [];
      return {
        disabled: false,
        options: items.map((c) => ({
          label: c.name ? `${c.name} (${c.status ?? 'unknown'})` : c.id,
          value: c.id,
        })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: 'Failed to load campaigns. Check your connection.' };
    }
  },
});

// Reusable dropdown: Page Templates
export const pageTemplateDropdown = Property.Dropdown<string>({
  displayName: 'Page Template',
  description: 'Select a Sendr Page template to generate content from.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your Sendr account first' };
    }
    try {
      const response = await sendrApiCall<{ templates: { id: string; name?: string }[] }>({
        token: auth as string,
        method: HttpMethod.GET,
        path: '/page-template/list',
      });
      const templates = response.body?.templates ?? [];
      return {
        disabled: false,
        options: templates.map((t) => ({
          label: t.name ? `${t.name} (${t.id})` : t.id,
          value: t.id,
        })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: 'Failed to load page templates. Check your connection.' };
    }
  },
});

// Reusable dropdown: Webhooks
export const webhookDropdown = Property.Dropdown<string>({
  displayName: 'Webhook',
  description: 'Select the webhook to manage.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your Sendr account first' };
    }
    try {
      const response = await sendrApiCall<{ webhooks: { url: string; name?: string }[] }>({
        token: auth as string,
        method: HttpMethod.GET,
        path: '/webhook',
      });
      const webhooks = response.body?.webhooks ?? [];
      return {
        disabled: false,
        options: webhooks.map((w) => ({
          label: w.name ? `${w.name} (${w.url})` : w.url,
          value: w.url,
        })),
      };
    } catch (e) {
      return { disabled: true, options: [], placeholder: 'Failed to load webhooks. Check your connection.' };
    }
  },
});
