import { HttpMethod } from '@activepieces/pieces-common';
import { CONVERTKIT_API_URL } from './constants';
import { buildQueryParams } from './service';
import { kitHttp } from './http';

type QueryValue = string | number | undefined | null;

export const kitClient = {
  async request<T>({
    apiSecret,
    method,
    path,
    query,
    body,
  }: {
    apiSecret: string;
    method: HttpMethod;
    path: string;
    query?: Record<string, QueryValue>;
    body?: Record<string, unknown>;
  }): Promise<{ status: number; body: T }> {
    const hasBody = method === HttpMethod.POST || method === HttpMethod.PUT;
    const response = await kitHttp.sendRequest<T>({
      method,
      url: `${CONVERTKIT_API_URL}${path}`,
      queryParams: buildQueryParams(apiSecret, query ?? {}),
      body: hasBody ? body ?? {} : undefined,
    });
    return { status: response.status, body: response.body };
  },
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const kitCommon = {
  id({ value, label }: { value: unknown; label: string }): string {
    const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
    if (!/^\d+$/.test(text)) {
      throw new Error(`${label} must be a numeric Kit ID, got "${String(value ?? '')}".`);
    }
    return text;
  },
  page(value: unknown): number {
    if (value === undefined || value === null || value === '') {
      return 1;
    }
    const page = Number(value);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(`Page must be a whole number of 1 or more, got "${String(value)}".`);
    }
    return page;
  },
  email({ value, label }: { value: unknown; label: string }): string {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!EMAIL.test(text)) {
      throw new Error(`${label} must be a valid email address, got "${String(value ?? '')}".`);
    }
    return text;
  },
  toDate(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const text = String(value).trim().slice(0, 10);
    if (!ISO_DATE.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
      throw new Error(`"${String(value)}" is not a valid date. Use YYYY-MM-DD.`);
    }
    return text;
  },
  toDateTime({
    value,
    label,
    future = false,
  }: {
    value: unknown;
    label: string;
    future?: boolean;
  }): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const text = String(value).trim();
    const time = Date.parse(text);
    if (Number.isNaN(time)) {
      throw new Error(`${label} must be an ISO 8601 date-time, got "${text}".`);
    }
    if (future && time <= Date.now()) {
      throw new Error(`${label} must be in the future, got "${text}".`);
    }
    return text;
  },
  toIdList(value: unknown): number[] | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return kitCommon.toIdList([value]);
    }
    if (typeof value === 'string') {
      const text = value.trim();
      if (text.startsWith('[')) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error(`"${text}" is not a valid list of IDs. Use a JSON array like [123, 456] or comma-separated IDs.`);
        }
        return kitCommon.toIdList(parsed);
      }
      return kitCommon.toIdList(
        text
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part.length > 0),
      );
    }
    if (!Array.isArray(value)) {
      throw new Error('IDs must be a list of numeric IDs.');
    }
    if (value.length === 0) {
      return undefined;
    }
    return value.map((item) => {
      const id = Number(item);
      if (!Number.isInteger(id)) {
        throw new Error(`"${String(item)}" is not a valid numeric ID.`);
      }
      return id;
    });
  },
  toFields(value: unknown): Record<string, unknown> | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      try {
        return kitCommon.toFields(JSON.parse(value));
      } catch {
        throw new Error('Custom Fields must be a JSON object of field key to value.');
      }
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Custom Fields must be a JSON object of field key to value.');
    }
    const fields: Record<string, unknown> = Object.fromEntries(Object.entries(value));
    return Object.keys(fields).length > 0 ? fields : undefined;
  },
  compact(values: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        result[key] = value;
      }
    }
    return result;
  },
};
