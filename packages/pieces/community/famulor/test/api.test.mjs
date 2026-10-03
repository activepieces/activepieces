import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { operations, catalogSource } from '../src/lib/generated/catalog';
import { famulorApi } from '../src/lib/common/client';
import { famulorAuth } from '../src/lib/auth';
import { nativeActions, apiOperation } from '../src/lib/actions/api-operation';
import { customApiCall } from '../src/lib/actions/custom-api-call';
import { famulor } from '../src';

const operation = (id) => operations.find((item) => item.id === id);
const token = 'test-workspace-key';
const success = { status: 200, headers: {}, body: { data: { id: 'test-record' } } };
const context = (propsValue) => ({ auth: { secret_text: token }, propsValue, files: { write: async () => 'test-file' } });
afterEach(() => vi.restoreAllMocks());

describe('catalog and metadata', () => {
  it('covers every generated public operation with unique identifiers', () => {
    expect(operations).toHaveLength(catalogSource.count);
    expect(catalogSource.count).toBe(423);
    expect(new Set(operations.map((item) => item.id)).size).toBe(operations.length);
    for (const item of operations) {
      expect(item.path).toMatch(/^\/[a-z0-9]/i);
      expect(item.description).toBeTruthy();
      expect(item.parameters.every((parameter) => ['path', 'query', 'header'].includes(parameter.in))).toBe(true);
    }
  });
  it('registers all native actions, guided catalog, custom requests and triggers', () => {
    const actions = Object.values(famulor.actions());
    expect(actions).toHaveLength(nativeActions.length + 2);
    expect(new Set(actions.map((action) => action.name)).size).toBe(actions.length);
    expect(Object.values(famulor.triggers())).toHaveLength(9);
    for (const action of nativeActions) {
      expect(action.audience).toBe('both');
      expect(action.aiMetadata.description).toBeTruthy();
      expect(action.classification).toBeTruthy();
    }
    expect(apiOperation.audience).toBe('human');
  });
  it('returns guided properties for selected operations without network access', async () => {
    const props = await apiOperation.props.input.props({ operation: 'createCall' });
    expect(props.body_assistant_id.required).toBe(true);
    expect(props.body_to_number.required).toBe(true);
    expect(await apiOperation.props.input.props({})).toEqual({});
    await expect(apiOperation.props.input.props({ operation: 'unknown' })).rejects.toThrow('supported');
  });
});

describe('current API transport', () => {
  it('dispatches every catalog endpoint through the authenticated, fixed-origin transport', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    const sample = (field) => {
      if (field.enum) return field.enum.find((value) => value !== null);
      if (field.type === 'boolean') return false;
      if (field.type === 'number' || field.type === 'integer') return field.minimum ?? 1;
      if (field.type === 'array') return [];
      if (field.type === 'object' || field.type === 'json') return {};
      const length = Math.max(field.minLength ?? 1, Math.min(4, field.maxLength ?? 4));
      return field.format === 'uuid' ? '00000000-0000-4000-8000-000000000001' : 'test'.padEnd(length, 'x').slice(0, length);
    };
    for (const operation of operations) {
      const values = Object.fromEntries(operation.parameters.filter((field) => field.required).map((field) => [`${field.in}_${field.name}`, sample(field)]));
      if (operation.body?.fields) Object.assign(values, Object.fromEntries(operation.body.fields.filter((field) => field.required).map((field) => [`body_${field.name}`, sample(field)])));
      else if (operation.body?.required) values.body = {};
      await famulorApi.execute({ token, operation, values });
      const request = send.mock.lastCall[0];
      expect(new URL(request.url).origin).toBe('https://app.famulor.io');
      expect(new URL(request.url).pathname).toMatch(/^\/api\/v1\//);
      expect(request.method).toBe(operation.method);
      expect(request.authentication.token).toBe(token);
      expect(request.followRedirects).toBe(false);
    }
    expect(send).toHaveBeenCalledTimes(catalogSource.count);
  });
  it('validates keys through /me and handles failed authentication', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    expect(await famulorAuth.validate({ auth: token })).toEqual({ valid: true });
    expect(send.mock.calls[0][0]).toMatchObject({ url: 'https://app.famulor.io/api/v1/me', followRedirects: false, retries: 0, authentication: { token } });
    send.mockRejectedValue(new Error('Authentication failed'));
    expect((await famulorAuth.validate({ auth: token })).valid).toBe(false);
  });
  it('uses UUIDs and the current call body and preserves nested output', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    const output = await nativeActions.find((action) => action.name === 'makePhoneCall').run(context({ body_assistant_id: '00000000-0000-4000-8000-000000000001', body_to_number: '+4915123456789', body_lead: { name: 'Test Contact' } }));
    expect(output).toEqual(success.body);
    expect(send.mock.calls[0][0]).toMatchObject({ method: 'POST', url: 'https://app.famulor.io/api/v1/calls', body: { assistant_id: '00000000-0000-4000-8000-000000000001', to_number: '+4915123456789', lead: { name: 'Test Contact' } } });
  });
  it('serializes repeated query filters and dynamic JSON values', () => {
    const request = famulorApi.buildRequest({ operation: operation('listAudienceContacts'), values: { query_channel: '["call","email"]', query_dnc: 'false', query_limit: '10' } });
    const url = new URL(request.url);
    expect(url.searchParams.getAll('channel')).toEqual(['call', 'email']);
    expect(url.searchParams.get('dnc')).toBe('false');
    expect(url.searchParams.get('limit')).toBe('10');
  });
  it('keeps zero, false, null and explicit empty strings in body fields', () => {
    const request = famulorApi.buildRequest({ operation: operation('updateAssistant'), values: { path_id: '00000000-0000-4000-8000-000000000001', body_name: '', body_extra: { greeting: null } } });
    expect(request.body).toMatchObject({ name: '', greeting: null });
  });
  it('validates required, enum and numeric inputs before a request', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest');
    await expect(famulorApi.execute({ token, operation: operation('createCall'), values: {} })).rejects.toThrow('required');
    expect(() => famulorApi.buildRequest({ operation: operation('listCalls'), values: { query_limit: -1 } })).toThrow('at least');
    expect(() => famulorApi.buildRequest({ operation: operation('listCalls'), values: { query_status: 'invalid' } })).toThrow('one of');
    expect(send).not.toHaveBeenCalled();
  });
  it.each(['..', '../admin', '%2e%2e', 'x/y', 'x\\y'])('rejects path traversal: %s', (path_id) => {
    expect(() => famulorApi.buildRequest({ operation: operation('getCall'), values: { path_id } })).toThrow('identifier');
  });
  it('does not follow redirects or retry billable actions', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ ...success, status: 302 });
    await expect(famulorApi.execute({ token, operation: operation('getMe'), values: {} })).rejects.toThrow('Redirects');
    expect(send.mock.calls[0][0]).toMatchObject({ followRedirects: false, retries: 0 });
  });
  it('reports API failures without echoing request bodies or credentials', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({ sensitive: 'never-echo' }, { status: 403, responseBody: { error: 'insufficient_scope' } }));
    await expect(famulorApi.execute({ token, operation: operation('getMe'), values: {} })).rejects.toThrow('HTTP 403: insufficient_scope');
  });
  it('supports JSON union bodies, guided operations and binary previews', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    await apiOperation.run(context({ operation: 'setAssistantAvatar', input: { path_id: '00000000-0000-4000-8000-000000000001', body: { data_base64: 'dGVzdA==', content_type: 'image/png' } } }));
    expect(send.mock.calls[0][0].body).toEqual({ data_base64: 'dGVzdA==', content_type: 'image/png' });
    send.mockResolvedValue({ ...success, body: Buffer.from('test-audio') });
    expect(await apiOperation.run(context({ operation: 'getVoicePreview', input: { path_id: 'test-voice' } }))).toEqual({ file: 'test-file' });
  });
});

describe('custom request boundary', () => {
  it.each(['https://example.com/api/v1/me', 'http://example.com/me', '//example.com/me', 'https://app.famulor.io/api/admin/users', '/../../admin/users', '/%2e%2e/admin'])('rejects untrusted targets: %s', async (url) => {
    const send = vi.spyOn(httpClient, 'sendRequest');
    await expect(customApiCall.run(context({ url: { url }, method: 'GET' }))).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it('accepts relative and canonical Famulor API URLs', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(success);
    for (const url of ['/me', 'https://app.famulor.io/api/v1/me']) await customApiCall.run(context({ url: { url }, method: 'GET', followRedirects: false }));
    expect(send.mock.calls.map(([request]) => request.url)).toEqual(['https://app.famulor.io/api/v1/me', 'https://app.famulor.io/api/v1/me']);
  });
  it('rejects redirect following and credential header overrides', async () => {
    await expect(customApiCall.run(context({ url: { url: '/me' }, method: 'GET', followRedirects: true }))).rejects.toThrow('redirects');
    await expect(customApiCall.run(context({ url: { url: '/me' }, method: 'GET', headers: { authorization: 'other' } }))).rejects.toThrow('overridden');
  });
});
