import { AuthenticationType, httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import type { ApiField, ApiOperation } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalize({ field, value }: { field: ApiField; value: unknown }): unknown {
  if (value === undefined || (value === '' && field.type !== 'string')) {
    if (field.required) throw new Error(`${field.name} is required.`);
    return undefined;
  }
  if (value === null) return value;
  if (typeof value === 'string' && ['json', 'object', 'array', 'boolean', 'integer', 'number'].includes(field.type)) {
    try { value = JSON.parse(value); } catch { throw new Error(`${field.name} must be valid ${field.type}.`); }
  }
  if (field.enum && !field.enum.includes(value)) throw new Error(`${field.name} must be one of: ${field.enum.join(', ')}.`);
  if (['integer', 'number'].includes(field.type)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || (field.type === 'integer' && !Number.isInteger(value))) throw new Error(`${field.name} must be a valid ${field.type}.`);
    if (field.minimum !== undefined && value < field.minimum) throw new Error(`${field.name} must be at least ${field.minimum}.`);
    if (field.maximum !== undefined && value > field.maximum) throw new Error(`${field.name} must be at most ${field.maximum}.`);
  }
  if (field.type === 'boolean' && typeof value !== 'boolean') throw new Error(`${field.name} must be a boolean.`);
  if (field.type === 'array' && !Array.isArray(value)) throw new Error(`${field.name} must be an array.`);
  if (field.type === 'object' && !isRecord(value)) throw new Error(`${field.name} must be an object.`);
  if (field.type === 'string') {
    if (typeof value !== 'string') throw new Error(`${field.name} must be text.`);
    if (field.minLength !== undefined && value.length < field.minLength) throw new Error(`${field.name} is too short.`);
    if (field.maxLength !== undefined && value.length > field.maxLength) throw new Error(`${field.name} is too long.`);
  }
  return value;
}

function scalar(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new Error('Path, query and header values must be scalar values.');
}

function pathComponent(value: unknown): string {
  const text = scalar(value);
  if (!text || /[\\/]/.test(text) || text === '.' || text === '..' || /%[0-9a-f]{2}/i.test(text)) throw new Error('Invalid resource identifier.');
  return encodeURIComponent(text);
}

function buildRequest({ operation, values }: { operation: ApiOperation; values: Record<string, unknown> }) {
  let path = operation.path;
  const query = new URLSearchParams();
  const headers: Record<string, string> = {};
  for (const field of operation.parameters) {
    const value = normalize({ field, value: values[`${field.in}_${field.name}`] });
    if (value === undefined) continue;
    if (field.in === 'path') path = path.replace(`{${field.name}}`, pathComponent(value));
    if (field.in === 'header') {
      if (/^(authorization|cookie|host)$/i.test(field.name)) throw new Error('Connection headers cannot be overridden.');
      headers[field.name] = scalar(value);
    }
    if (field.in === 'query') {
      if (Array.isArray(value)) {
        if (field.explode === false) query.append(field.name, value.map(scalar).join(field.style === 'spaceDelimited' ? ' ' : field.style === 'pipeDelimited' ? '|' : ','));
        else for (const item of value) query.append(field.name, scalar(item));
      } else query.append(field.name, scalar(value));
    }
  }
  if (path.includes('{')) throw new Error('A required resource identifier is missing.');
  let body: unknown;
  if (operation.body) {
    if (operation.body.fields) {
      const extra = normalize({ field: { name: 'Additional body fields', type: 'object', required: false }, value: values['body_extra'] });
      if (extra !== undefined && !isRecord(extra)) throw new Error('Additional body fields must be a JSON object.');
      const fields = Object.fromEntries(operation.body.fields.map((field) => [field.name, normalize({ field, value: values[`body_${field.name}`] ?? extra?.[field.name] })]).filter(([, value]) => value !== undefined));
      body = { ...(extra ?? {}), ...fields };
    } else body = normalize({ field: { name: 'Request body', required: operation.body.required, type: 'json' }, value: values['body'] });
  }
  return { url: `${BASE_URL}${path}${query.size ? `?${query}` : ''}`, headers, body };
}

async function request({ token, method, path, query }: { token: string; method: HttpMethod; path: string; query?: Record<string, string> }): Promise<unknown> {
  if (!/^\/[a-z0-9][a-z0-9/_-]*$/i.test(path)) throw new Error('Invalid API path.');
  return send({ token, method, url: `${BASE_URL}${path}`, query });
}

async function execute({ token, operation, values }: { token: string; operation: ApiOperation; values: Record<string, unknown> }): Promise<unknown> {
  const method = Object.values(HttpMethod).find((method) => method === operation.method);
  if (!method) throw new Error('Unsupported HTTP method.');
  return send({ token, method, ...buildRequest({ operation, values }), binary: operation.binary });
}

async function send({ token, method, url, body, headers, query, binary }: { token: string; method: HttpMethod; url: string; body?: unknown; headers?: Record<string, string>; query?: Record<string, string>; binary?: boolean }): Promise<unknown> {
  try {
    const response = await httpClient.sendRequest({
      method, url, body, headers, queryParams: query,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      followRedirects: false, retries: 0, timeout: 60000,
      responseType: binary ? 'arraybuffer' : 'json',
    });
    if (response.status < 200 || response.status >= 300) throw new Error(`Famulor returned HTTP ${response.status}. Redirects are not followed.`);
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const body = error.response.body;
      const detail = isRecord(body) ? body['error'] : undefined;
      const code = typeof detail === 'string' ? detail : isRecord(detail) && typeof detail['code'] === 'string' ? detail['code'] : 'request_failed';
      throw new Error(`Famulor returned HTTP ${error.response.status}: ${code}. Check the inputs, connection scopes and workspace permissions.`);
    }
    throw error;
  }
}

export const BASE_URL = 'https://app.famulor.io/api/v1';
export const famulorApi = { request, execute, buildRequest, isRecord };
