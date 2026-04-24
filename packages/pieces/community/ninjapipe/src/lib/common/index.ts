import { httpClient, HttpMethod, AuthenticationType, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';

export type NinjaPipeAuth = { base_url: string; api_key: string };

export function getAuth(context: { auth: unknown }): NinjaPipeAuth {
  return context.auth as unknown as NinjaPipeAuth;
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
          .map(([k, v]) => [k, String(v)])
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

export function extractItems(response: unknown): unknown[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  const r = response as Record<string, unknown>;
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.items)) return r.items;
  if (Array.isArray(r.results)) return r.results;
  const resourceKeys = [
    'contacts', 'companies', 'deals', 'products', 'budgets', 'lists',
    'pipelines', 'pipeline_items', 'pipelineItems', 'invoices', 'orders', 'projects', 'tasks', 'databins', 'responses',
  ];
  for (const key of resourceKeys) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }
  return [r];
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
  const cf = flat.custom_fields as Record<string, unknown> | undefined;
  if (cf && typeof cf === 'object' && !Array.isArray(cf)) {
    for (const [key, value] of Object.entries(cf)) {
      if (!(key in flat)) flat[key] = value;
      flat[`cf_${key}`] = value;
    }
  }
  delete flat.custom_fields;
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

  getStateDropdownForCountry: (countryCode: string | undefined) => {
    const states: Record<string, { label: string; value: string }[]> = {
      DE: [
        { label: 'Baden-Württemberg', value: 'BW' },
        { label: 'Bavaria', value: 'BY' },
        { label: 'Berlin', value: 'BE' },
        { label: 'Brandenburg', value: 'BB' },
        { label: 'Bremen', value: 'HB' },
        { label: 'Hamburg', value: 'HH' },
        { label: 'Hesse', value: 'HE' },
        { label: 'Lower Saxony', value: 'NI' },
        { label: 'Mecklenburg-Vorpommern', value: 'MV' },
        { label: 'North Rhine-Westphalia', value: 'NW' },
        { label: 'Rhineland-Palatinate', value: 'RP' },
        { label: 'Saarland', value: 'SL' },
        { label: 'Saxony', value: 'SN' },
        { label: 'Saxony-Anhalt', value: 'ST' },
        { label: 'Schleswig-Holstein', value: 'SH' },
        { label: 'Thuringia', value: 'TH' },
      ],
      AT: [
        { label: 'Burgenland', value: 'B' },
        { label: 'Carinthia', value: 'K' },
        { label: 'Lower Austria', value: 'N' },
        { label: 'Upper Austria', value: 'O' },
        { label: 'Salzburg', value: 'S' },
        { label: 'Styria', value: 'ST' },
        { label: 'Tyrol', value: 'T' },
        { label: 'Vorarlberg', value: 'V' },
        { label: 'Vienna', value: 'W' },
      ],
      CH: [
        { label: 'Zürich', value: 'ZH' },
        { label: 'Bern', value: 'BE' },
        { label: 'Lucerne', value: 'LU' },
        { label: 'Uri', value: 'UR' },
        { label: 'Schwyz', value: 'SZ' },
        { label: 'Obwalden', value: 'OW' },
        { label: 'Nidwalden', value: 'NW' },
        { label: 'Glarus', value: 'GL' },
        { label: 'Zug', value: 'ZG' },
        { label: 'Fribourg', value: 'FR' },
        { label: 'Solothurn', value: 'SO' },
        { label: 'Basel-Stadt', value: 'BS' },
        { label: 'Basel-Landschaft', value: 'BL' },
        { label: 'Schaffhausen', value: 'SH' },
        { label: 'Appenzell Ausserrhoden', value: 'AR' },
        { label: 'Appenzell Innerrhoden', value: 'AI' },
        { label: 'St. Gallen', value: 'SG' },
        { label: 'Graubünden', value: 'GR' },
        { label: 'Aargau', value: 'AG' },
        { label: 'Thurgau', value: 'TG' },
        { label: 'Ticino', value: 'TI' },
        { label: 'Vaud', value: 'VD' },
        { label: 'Valais', value: 'VS' },
        { label: 'Neuchâtel', value: 'NE' },
        { label: 'Geneva', value: 'GE' },
        { label: 'Jura', value: 'JU' },
      ],
    };
    return countryCode ? states[countryCode] || [] : [];
  },

  pipelineDropdown: Property.Dropdown({
    auth: ninjapipeAuth,

    displayName: 'Pipeline',
    description: 'Select a pipeline.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      try {
        const a = auth as unknown as NinjaPipeAuth;
        const response = await ninjapipeApiCall<{ data?: unknown[]; pipelines?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/pipelines',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body);
        return {
          disabled: false,
          options: items.map((p: any) => ({ label: p.name || p.title || String(p.id), value: String(p.id) })),
        };
      } catch (e) {
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
        const a = auth as unknown as NinjaPipeAuth;
        const response = await ninjapipeApiCall<{ data?: unknown[]; contacts?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/contacts',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body);
        return {
          disabled: false,
          options: items.map((c: any) => ({
            label: `${c.first_name || ''} ${c.last_name || ''} <${c.email || 'no-email'}>` || c.email || String(c.id),
            value: String(c.id),
          })),
        };
      } catch (e) {
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
        const a = auth as unknown as NinjaPipeAuth;
        const response = await ninjapipeApiCall<{ data?: unknown[]; companies?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/companies',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body);
        return {
          disabled: false,
          options: items.map((c: any) => ({ label: c.name || c.title || String(c.id), value: String(c.id) })),
        };
      } catch (e) {
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
        const a = auth as unknown as NinjaPipeAuth;
        const response = await ninjapipeApiCall<{ data?: unknown[]; projects?: unknown[] }>({
          auth: a,
          method: HttpMethod.GET,
          path: '/projects',
          queryParams: { limit: '100' },
        });
        const items = extractItems(response.body);
        return {
          disabled: false,
          options: items.map((p: any) => ({ label: p.name || p.title || String(p.id), value: String(p.id) })),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: 'Failed to load projects. Check connection.' };
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
