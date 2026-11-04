import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient, HttpError, HttpMethod, HttpRequest, HttpResponse } from '@activepieces/pieces-common';
import { assertKnackRecordFound, knackApiCall, toKnackError } from '../src/lib/common/client';
import { recordFields } from '../src/lib/common/props';
import { findRecordAction } from '../src/lib/actions/find-record';
import { searchRecordsAction } from '../src/lib/actions/search-records';
import { getRecordAction } from '../src/lib/actions/get-record';
import { deleteRecordAction } from '../src/lib/actions/delete-record';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('client error mapping', () => {
  it('uses the Knack errors[].message and status, keeps vendor body on responseBody', async () => {
    const body = { errors: [{ message: 'Field Name is required' }] };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpError({ status: 400, body }));
    const err: unknown = await knackApiCall({ method: HttpMethod.GET, resourceUri: '/objects', auth }).catch((e: unknown) => e);
    expect(isKnackError(err)).toBe(true);
    expect(errorMessage(err)).toBe('Knack API error (HTTP 400): Field Name is required');
    expect(readProp({ value: err, key: 'status' })).toBe(400);
    expect(readProp({ value: err, key: 'responseBody' })).toEqual(body);
    expect(err).not.toHaveProperty('body');
  });

  it('adds the 404 hint when Knack returns an empty body', () => {
    const err = toKnackError(httpError({ status: 404, body: '' }));
    expect(err.message).toBe('Knack API error (HTTP 404): Check the object key and record ID.');
    expect(readProp({ value: err, key: 'status' })).toBe(404);
  });

  it('parses string JSON bodies and adds the 401 hint', () => {
    const err = toKnackError(httpError({ status: 401, body: JSON.stringify({ message: 'Invalid API key' }) }));
    expect(err.message).toBe('Knack API error (HTTP 401): Invalid API key: Check the API Key and Application ID in the connection.');
  });

  it('passes through non-HTTP errors unchanged', () => {
    const original = new Error('socket hang up');
    expect(toKnackError(original)).toBe(original);
  });

  it('sends the Knack auth headers', async () => {
    const send = mockSend(() => ({ objects: [] }));
    await knackApiCall({ method: HttpMethod.GET, resourceUri: '/objects', auth });
    const req = firstRequest(send);
    expect(req.url).toBe('https://api.knack.com/v1/objects');
    expect(req.headers?.['X-Knack-Application-ID']).toBe('app');
    expect(req.headers?.['X-Knack-REST-API-Key']).toBe('k');
  });
});

describe('assertKnackRecordFound', () => {
  it('turns the 200 empty-records reply into a 404', () => {
    const live = { records: [], total_records: 0 };
    let caught: unknown;
    try {
      assertKnackRecordFound({ record: live, recordId: '6908aa', objectKey: 'object_3' });
    } catch (e) {
      caught = e;
    }
    expect(errorMessage(caught)).toContain('HTTP 404');
    expect(errorMessage(caught)).toContain('Record 6908aa not found in object_3');
    expect(readProp({ value: caught, key: 'status' })).toBe(404);
    expect(readProp({ value: caught, key: 'responseBody' })).toEqual(live);
  });

  it('accepts a real record', () => {
    expect(() =>
      assertKnackRecordFound({ record: { id: '6908aa', field_23: 'Jane' }, recordId: '6908aa', objectKey: 'object_3' })
    ).not.toThrow();
  });

  it('get_record throws on the empty-records reply', async () => {
    mockSend(() => ({ records: [], total_records: 0 }));
    await expect(
      callRun({ fn: getRecordAction.run, propsValue: { object_key: 'object_3', record_id: 'missing' } })
    ).rejects.toThrow(/not found in object_3/);
  });
});

describe('deleteRecordAction', () => {
  it('sends DELETE and returns Knack delete flag with deleted and id', async () => {
    const send = mockSend(() => ({ delete: true }));
    const out = await callRun({ fn: deleteRecordAction.run, propsValue: { object: 'object_3', recordId: ' r1 ' } });
    const req = firstRequest(send);
    expect(req.method).toBe(HttpMethod.DELETE);
    expect(req.url).toBe('https://api.knack.com/v1/objects/object_3/records/r1');
    expect(out).toEqual({ delete: true, deleted: true, id: 'r1' });
  });

  it('throws not found when Knack replies 200 without delete: true', async () => {
    mockSend(() => ({ records: [] }));
    await expect(
      callRun({ fn: deleteRecordAction.run, propsValue: { object: 'object_3', recordId: 'missing' } })
    ).rejects.toThrow(/missing not found in object_3, nothing was deleted/);
  });
});

describe('recordFields', () => {
  it('maps multiple_choice format.options, date_time and the JSON fallback; skips read-only types', async () => {
    const props = await propsFor([
      { key: 'field_31', name: 'Status', type: 'multiple_choice', format: { type: 'single', options: ['New', 'Active', 'Lost'] } },
      { key: 'field_35', name: 'Tags', type: 'multiple_choice', format: { type: 'multi', options: ['a'] } },
      { key: 'field_34', name: 'Joined', type: 'date_time' },
      { key: 'field_27', name: 'Owner', type: 'connection' },
      { key: 'field_24', name: 'Record ID', type: 'auto_increment' },
    ]);
    expect(propType({ props, key: 'field_31' })).toBe('STATIC_DROPDOWN');
    expect(optionValues({ props, key: 'field_31' })).toEqual(['New', 'Active', 'Lost']);
    expect(propType({ props, key: 'field_35' })).toBe('STATIC_MULTI_SELECT_DROPDOWN');
    expect(propType({ props, key: 'field_34' })).toBe('DATE_TIME');
    expect(propType({ props, key: 'field_27' })).toBe('JSON');
    expect(readProp({ value: props, key: 'field_24' })).toBeUndefined();
  });

  it('does not crash when format.options is missing', async () => {
    const props = await propsFor([{ key: 'field_31', name: 'Status', type: 'multiple_choice' }]);
    expect(propType({ props, key: 'field_31' })).toBe('STATIC_DROPDOWN');
    expect(optionValues({ props, key: 'field_31' })).toEqual([]);
  });

  it('multiple_choice listing options only under `choices` (raw dump shape) still yields a dropdown', async () => {
    const props = await propsFor([
      { key: 'field_31', label: 'Status', name: 'Status', type: 'multiple_choice', required: false, choices: ['New', 'Active', 'Lost'] },
    ]);
    expect(propType({ props, key: 'field_31' })).toBe('STATIC_DROPDOWN');
    expect(optionValues({ props, key: 'field_31' })).toEqual([]);
  });

  it('surfaces the Knack error when the object fetch fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpError({ status: 401, body: { message: 'Invalid API key' } }));
    await expect(
      callRun({ fn: recordFields.props, propsValue: { object: 'object_x' }, asProps: true })
    ).rejects.toThrow('Knack API error (HTTP 401): Invalid API key');
  });
});

describe('find_record', () => {
  it('sends a {match:"and",rules:[...]} filter with rows_per_page 1', async () => {
    const send = mockSend((req) =>
      req.url.endsWith('/records')
        ? { records: [{ id: 'r1', field_23: 'Jane' }], total_records: 1 }
        : { object: { fields: [{ key: 'field_23', name: 'Name', type: 'short_text' }] } }
    );
    const result = await callRun({
      fn: findRecordAction.run,
      propsValue: { object: 'object_3', fieldId: 'field_23', fieldValue: 'Jane' },
    });
    const req = firstRequest(send);
    expect(JSON.parse(req.queryParams?.['filters'] ?? '')).toEqual({
      match: 'and',
      rules: [{ field: 'field_23', operator: 'is', value: 'Jane' }],
    });
    expect(req.queryParams?.['rows_per_page']).toBe('1');
    expect(result).toEqual({ found: true, record: { id: 'r1', Name: 'Jane' } });
  });

  it('returns found:false on the empty page', async () => {
    mockSend(() => ({ records: [], total_records: 0 }));
    const result = await callRun({
      fn: findRecordAction.run,
      propsValue: { object: 'object_3', fieldId: 'field_23', fieldValue: 'nobody' },
    });
    expect(result).toMatchObject({ found: false, record: null });
  });
});

describe('search_records', () => {
  it('builds filters with match "or", sort and page', async () => {
    const rules = [{ field: 'field_23', operator: 'contains', value: 'J' }];
    const { out, query, url } = await runSearch({ match: 'or', rules, sort_field: 'field_23', sort_order: 'desc', page: 2, rows_per_page: 50 });
    expect(url).toBe('https://api.knack.com/v1/objects/object_3/records');
    expect(JSON.parse(query['filters'] ?? '')).toEqual({ match: 'or', rules });
    expect(query['sort_field']).toBe('field_23');
    expect(query['sort_order']).toBe('desc');
    expect(query['page']).toBe('2');
    expect(query['rows_per_page']).toBe('50');
    expect(out).toEqual({ records: [{ id: 'r1', fields: { field_23: 'Jane' } }], total_records: 1, total_pages: 1, current_page: 1 });
  });

  it('defaults: no filters, no sort, page 1, 25 rows; unknown match falls back to and', async () => {
    const { query } = await runSearch({});
    expect(query['filters']).toBeUndefined();
    expect(query['sort_field']).toBeUndefined();
    expect(query['sort_order']).toBeUndefined();
    expect(query['page']).toBe('1');
    expect(query['rows_per_page']).toBe('25');
    vi.restoreAllMocks();
    const second = await runSearch({ match: 'xor', rules: '[{"field":"field_1","operator":"is","value":"x"}]' });
    expect(JSON.parse(second.query['filters'] ?? '').match).toBe('and');
  });

  it('clamps rows_per_page to 1..1000 and defaults sort_order to asc', async () => {
    expect((await runSearch({ rows_per_page: 5000 })).query['rows_per_page']).toBe('1000');
    vi.restoreAllMocks();
    expect((await runSearch({ rows_per_page: 0 })).query['rows_per_page']).toBe('1');
    vi.restoreAllMocks();
    expect((await runSearch({ sort_field: 'field_1' })).query['sort_order']).toBe('asc');
  });

  it('keeps the wrapped match when the match prop is unset, and lets an explicit prop win', async () => {
    const rules = [{ field: 'field_1', operator: 'is', value: 'x' }];
    const wrapped = await runSearch({ rules: { match: 'or', rules } });
    expect(JSON.parse(wrapped.query['filters'] ?? '')).toEqual({ match: 'or', rules });
    vi.restoreAllMocks();
    const explicit = await runSearch({ match: 'and', rules: { match: 'or', rules } });
    expect(JSON.parse(explicit.query['filters'] ?? '').match).toBe('and');
    vi.restoreAllMocks();
    const plain = await runSearch({ rules });
    expect(JSON.parse(plain.query['filters'] ?? '').match).toBe('and');
  });

  it('accepts a {match,rules} object and rejects malformed rules', async () => {
    const { query } = await runSearch({ rules: { match: 'or', rules: [{ field: 'field_1', operator: 'is blank' }] } });
    expect(JSON.parse(query['filters'] ?? '').rules).toHaveLength(1);
    await expect(runSearch({ rules: '{not json' })).rejects.toThrow('Value is not valid JSON.');
    await expect(runSearch({ rules: { field: 'field_1' } })).rejects.toThrow(/must be a JSON array/);
  });
});

function fakeResponse(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function mockSend(impl: (req: HttpRequest) => unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req: HttpRequest) => fakeResponse(impl(req)));
}

function firstRequest(send: ReturnType<typeof mockSend>): HttpRequest {
  return send.mock.calls[0][0];
}

function httpError({ status, body }: { status: number; body: unknown }): HttpError {
  return new HttpError({}, { status, responseBody: body });
}

function callRun({ fn, propsValue, asProps = false }: { fn: unknown; propsValue: Record<string, unknown>; asProps?: boolean }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  const args = asProps ? [{ auth, ...propsValue }, {}] : [{ auth, propsValue }];
  return Promise.resolve(Reflect.apply(fn, undefined, args));
}

async function propsFor(fields: unknown[]): Promise<unknown> {
  mockSend(() => ({ object: { key: 'object_3', fields } }));
  return callRun({ fn: recordFields.props, propsValue: { object: 'object_3' }, asProps: true });
}

async function runSearch(propsValue: Record<string, unknown>) {
  const send = mockSend(() => ({ records: [{ id: 'r1', field_23: 'Jane' }], total_records: '1', total_pages: 1, current_page: '1' }));
  const out = await callRun({ fn: searchRecordsAction.run, propsValue: { object_key: ' object_3 ', ...propsValue } });
  const req = firstRequest(send);
  return { out, url: req.url, query: req.queryParams ?? {} };
}

function readProp({ value, key }: { value: unknown; key: string }): unknown {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  return Reflect.get(value, key);
}

function propType({ props, key }: { props: unknown; key: string }): unknown {
  return readProp({ value: readProp({ value: props, key }), key: 'type' });
}

function optionValues({ props, key }: { props: unknown; key: string }): unknown[] {
  const options = readProp({ value: readProp({ value: readProp({ value: props, key }), key: 'options' }), key: 'options' });
  return Array.isArray(options) ? options.map((option: unknown) => readProp({ value: option, key: 'value' })) : [];
}

function isKnackError(value: unknown): value is Error {
  return value instanceof Error && value.name === 'KnackApiError';
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : '';
}

const auth = { type: 'CUSTOM_AUTH', props: { apiKey: 'k', applicationId: 'app' } } satisfies { type: string; props: { apiKey: string; applicationId: string } };
