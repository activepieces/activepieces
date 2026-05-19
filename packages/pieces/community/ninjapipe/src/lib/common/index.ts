import { httpClient, HttpMethod, AuthenticationType, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../';

export type NinjaPipeAuth = { base_url: string; api_key: string };

export function getAuth(context: { auth: unknown }): NinjaPipeAuth {
  const raw = context.auth as
    | (PiecePropValueSchema<typeof ninjapipeAuth> & { props?: { base_url?: string; api_key?: string } })
    | null
    | undefined;
  const base_url = raw?.props?.base_url ?? raw?.base_url;
  const api_key = raw?.props?.api_key ?? raw?.api_key;
  if (!base_url || !api_key) {
    throw new Error('NinjaPipe connection is missing Base URL or API Key. Reconnect the account.');
  }
  return { base_url, api_key };
}

export async function ninjapipeApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: NinjaPipeAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined>;
}): Promise<HttpResponse<T>> {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${auth.base_url.replace(/\/+$/, '')}${sanitizedPath}`;

  const cleanQuery = queryParams
    ? Object.fromEntries(
        Object.entries(queryParams)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      )
    : undefined;

  return await httpClient.sendRequest<T>({
    method,
    url,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.api_key,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
    queryParams: cleanQuery,
  });
}

const RESOURCE_KEYS = [
  'contacts', 'companies', 'deals', 'products', 'budgets', 'lists',
  'pipelines', 'pipeline_items', 'pipelineItems', 'invoices', 'orders', 'projects', 'tasks', 'databins', 'responses',
];

export function extractItems(response: unknown): unknown[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  const r = response as Record<string, unknown>;
  if (Array.isArray(r['data'])) return r['data'] as unknown[];
  if (Array.isArray(r['items'])) return r['items'] as unknown[];
  if (Array.isArray(r['results'])) return r['results'] as unknown[];
  for (const key of RESOURCE_KEYS) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }
  return [];
}

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

export function flattenCustomFields(record: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...record };
  const cf = flat['custom_fields'] as Record<string, unknown> | undefined;
  if (cf && typeof cf === 'object' && !Array.isArray(cf)) {
    for (const [key, value] of Object.entries(cf)) {
      if (!(key in flat)) flat[key] = value;
      flat[`cf_${key}`] = value;
    }
  }
  delete flat['custom_fields'];
  return flattenObject(flat);
}

export function flattenArray(items: unknown[]): Record<string, unknown>[] {
  return items.map((item) => {
    if (typeof item === 'object' && item !== null) {
      return flattenCustomFields(item as Record<string, unknown>);
    }
    return { raw_value: item };
  });
}

export function toDateOnly(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const str = String(value);
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const d = new Date(str);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

export function safeParseJson(value: unknown, fieldName: string): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON in field "${fieldName}".`);
  }
}

type DropdownItem = {
  id?: string | number;
  name?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

const buildDropdownOption = (item: DropdownItem) => ({
  label: item.name ?? item.title ?? String(item.id ?? ''),
  value: String(item.id ?? ''),
});

export const ninjapipeCommon = {
  countryDropdown: Property.StaticDropdown({
    displayName: 'Country',
    description: 'Select a country.',
    required: false,
    options: {
      options: [
        { label: 'Germany', value: 'DE' },
        { label: 'Austria', value: 'AT' },
        { label: 'Switzerland', value: 'CH' },
        { label: 'Belgium', value: 'BE' },
        { label: 'Netherlands', value: 'NL' },
        { label: 'Luxembourg', value: 'LU' },
        { label: 'France', value: 'FR' },
        { label: 'Italy', value: 'IT' },
        { label: 'Spain', value: 'ES' },
        { label: 'Portugal', value: 'PT' },
        { label: 'Poland', value: 'PL' },
        { label: 'Hungary', value: 'HU' },
        { label: 'United Kingdom', value: 'GB' },
        { label: 'United States', value: 'US' },
        { label: 'Canada', value: 'CA' },
      ],
    },
  }),

  pipelineDropdown: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Pipeline',
    description: 'Select a pipeline.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<{ data?: unknown[]; pipelines?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/pipelines',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map(buildDropdownOption),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load pipelines. Check connection.' };
      }
    },
  }),

  contactDropdown: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Contact',
    description: 'Select a contact.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<{ data?: unknown[]; contacts?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/contacts',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map((c) => ({
            label:
              `${c.first_name ?? ''} ${c.last_name ?? ''} <${c.email ?? 'no-email'}>`.trim() ||
              c.email ||
              String(c.id ?? ''),
            value: String(c.id ?? ''),
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load contacts. Check connection.' };
      }
    },
  }),

  companyDropdown: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Company',
    description: 'Select a company.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<{ data?: unknown[]; companies?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/companies',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map(buildDropdownOption),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load companies. Check connection.' };
      }
    },
  }),

  projectDropdown: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Project',
    description: 'Select a project.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<{ data?: unknown[]; projects?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/projects',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map(buildDropdownOption),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load projects. Check connection.' };
      }
    },
  }),

  projectDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Project',
    description: 'Select the project this task belongs to.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<{ data?: unknown[]; projects?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/projects',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map(buildDropdownOption),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load projects. Check connection.' };
      }
    },
  }),

  taskDropdown: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Task',
    description: 'Select a task. Pick the project first.',
    refreshers: ['projectId'],
    required: true,
    options: async ({ auth, projectId }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      if (!projectId) return { disabled: true, options: [], placeholder: 'Select a project first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<{ data?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: `/projects/${projectId}/tasks`,
          queryParams: { sort_by: 'created_at', sort_order: 'desc' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map(buildDropdownOption),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load tasks.' };
      }
    },
  }),

  taskStatusDropdown: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Task status.',
    required: false,
    defaultValue: 'To Do',
    options: {
      options: [
        { label: 'To Do', value: 'To Do' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Done', value: 'Done' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
  }),

  priorityDropdown: Property.StaticDropdown({
    displayName: 'Priority',
    description: 'Priority level.',
    required: false,
    defaultValue: 'Medium',
    options: {
      options: [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' },
      ],
    },
  }),

  projectStatusDropdown: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Project status.',
    required: false,
    defaultValue: 'Planning',
    options: {
      options: [
        { label: 'Planning', value: 'Planning' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'On Hold', value: 'On Hold' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
  }),

  budgetCategoryDropdown: Property.StaticDropdown({
    displayName: 'Category',
    description: 'Budget category.',
    required: false,
    options: {
      options: [
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Sales', value: 'Sales' },
        { label: 'Product', value: 'Product' },
        { label: 'Operations', value: 'Operations' },
      ],
    },
  }),

  budgetPeriodDropdown: Property.StaticDropdown({
    displayName: 'Period',
    description: 'Budget period.',
    required: false,
    options: {
      options: [
        { label: 'Monthly', value: 'Monthly' },
        { label: 'Quarterly', value: 'Quarterly' },
        { label: 'Yearly', value: 'Yearly' },
      ],
    },
  }),

  budgetStatusDropdown: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Budget status.',
    required: false,
    defaultValue: 'Active',
    options: {
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
  }),

  orderStatusDropdown: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Order status.',
    required: false,
    defaultValue: 'Processing',
    options: {
      options: [
        { label: 'Processing', value: 'Processing' },
        { label: 'Shipped', value: 'Shipped' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
  }),

  paymentStatusDropdown: Property.StaticDropdown({
    displayName: 'Payment Status',
    description: 'Payment status.',
    required: false,
    defaultValue: 'Pending',
    options: {
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Refunded', value: 'Refunded' },
        { label: 'Failed', value: 'Failed' },
      ],
    },
  }),

  pipelineDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Pipeline',
    description: 'Select a pipeline.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/pipelines',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return { disabled: false, options: items.map(buildDropdownOption) };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load pipelines.' };
      }
    },
  }),

  contactDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Contact',
    description: 'Select a contact.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/contacts',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return {
          disabled: false,
          options: items.map((c) => ({
            label:
              `${c.first_name ?? ''} ${c.last_name ?? ''} <${c.email ?? 'no-email'}>`.trim() ||
              c.email ||
              String(c.id ?? ''),
            value: String(c.id ?? ''),
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load contacts.' };
      }
    },
  }),

  companyDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Company',
    description: 'Select a company.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/companies',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return { disabled: false, options: items.map(buildDropdownOption) };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load companies.' };
      }
    },
  }),

  dealDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Deal',
    description: 'Select a deal.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/deals',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return { disabled: false, options: items.map(buildDropdownOption) };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load deals.' };
      }
    },
  }),

  productDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Product',
    description: 'Select a product.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/products',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return { disabled: false, options: items.map(buildDropdownOption) };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load products.' };
      }
    },
  }),

  budgetDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Budget',
    description: 'Select a budget.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/budgets',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as DropdownItem[];
        return { disabled: false, options: items.map(buildDropdownOption) };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load budgets.' };
      }
    },
  }),

  orderDropdownRequired: Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Order',
    description: 'Select an order.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = getAuth({ auth });
        const response = await ninjapipeApiCall<Record<string, unknown>>({
          auth: a,
          method: HttpMethod.GET,
          path: '/orders',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body) as Array<{ id?: string | number; order_number?: string; customer_name?: string }>;
        return {
          disabled: false,
          options: items.map((o) => ({
            label: `${o.order_number ?? ''} — ${o.customer_name ?? ''}`.trim().replace(/^—\s*/, '') || String(o.id ?? ''),
            value: String(o.id ?? ''),
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load orders.' };
      }
    },
  }),

  limitProperty: Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of records to return (1-100).',
    required: false,
    defaultValue: 20,
  }),

  statusFilterProperty: Property.ShortText({
    displayName: 'Status Filter',
    description: 'Filter records by status.',
    required: false,
  }),

  searchProperty: Property.ShortText({
    displayName: 'Search',
    description: 'Search query string.',
    required: false,
  }),

  ownerFilterProperty: Property.ShortText({
    displayName: 'Owner Filter',
    description: 'Filter by owner identifier.',
    required: false,
  }),
};
