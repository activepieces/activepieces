import { afterEach, describe, expect, it, vi } from 'vitest';
import { cognitoForms } from '../src';
import { createEntryAiAction } from '../src/lib/actions/ai/create-entry-ai';
import { deleteEntryAiAction } from '../src/lib/actions/ai/delete-entry-ai';
import { getEntryAiAction } from '../src/lib/actions/ai/get-entry-ai';
import { updateEntryAiAction } from '../src/lib/actions/ai/update-entry-ai';
import { createEntryAction } from '../src/lib/actions/create-entry';
import { deleteEntryAction } from '../src/lib/actions/delete-entry';
import { downloadFileAction } from '../src/lib/actions/download-file';
import { getEntryDocumentAction } from '../src/lib/actions/get-entry-document';
import { getFormSchemaAction } from '../src/lib/actions/get-form-schema';
import { listFormsAction } from '../src/lib/actions/list-forms';
import { setFormAvailabilityAction } from '../src/lib/actions/set-form-availability';
import { updateEntryAction } from '../src/lib/actions/update-entry';
import { cognitoFormsAuth } from '../src/lib/auth';
import { CognitoFormsApiError } from '../src/lib/common/client';
import { normalizeEntry, stripEmptyValues } from '../src/lib/common/entries';
import { decodeContent, MAX_FILE_BYTES } from '../src/lib/common/files';
import { buildFieldProps } from '../src/lib/common/props';
import { sampleEntry } from '../src/lib/common/trigger-helpers';

const KEY = 'test-key';
const BASE = 'https://www.cognitoforms.com/api';


function stubFetch(responses: Fake[]): Call[] {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => {
      headers[key] = value;
    });
    const raw = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ method: init?.method ?? 'GET', url: String(input), headers, body: raw ? JSON.parse(raw) : undefined });
    const next = responses.shift();
    if (!next) {
      throw new Error(`Unexpected request ${String(input)}`);
    }
    const status = next.status ?? 200;
    const payload = next.body === undefined ? null : JSON.stringify(next.body);
    return new Response(status === 204 ? null : payload, { status, headers: { 'content-type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

function ctx(props: Record<string, unknown>) {
  const written: { fileName: string; data: Buffer }[] = [];
  return {
    written,
    context: {
      auth: { type: 'SECRET_TEXT', secret_text: KEY },
      propsValue: props,
      files: {
        write: async ({ fileName, data }: { fileName: string; data: Buffer }) => {
          written.push({ fileName, data });
          return `file://${fileName}`;
        },
      },
    },
  };
}

async function run({ action, props }: { action: { run: unknown }; props: Record<string, unknown> }) {
  const { context, written } = ctx(props);
  if (typeof action.run !== 'function') {
    throw new Error('no run');
  }
  const output: unknown = await Reflect.apply(action.run, action, [context]);
  return { output, written };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('piece wiring', () => {
  it('registers 13 actions plus custom call and keeps one agent tool per job', () => {
    const actions = Object.values(cognitoForms.actions());
    expect(actions).toHaveLength(14);
    const agentVisible = actions.filter((a) => a.audience === 'ai' || a.audience === 'both').map((a) => a.name);
    expect(agentVisible.sort()).toEqual(
      ['create_entry_ai', 'delete_entry_ai', 'download_file', 'get_entry_ai', 'get_entry_document', 'get_form_schema', 'list_forms', 'set_form_availability', 'update_entry_ai'].sort(),
    );
    for (const name of ['create_entry', 'update_entry', 'get_entry', 'delete_entry']) {
      expect(cognitoForms.actions()[name].audience).toBe('human');
    }
  });

  it('custom API call sends the secret text, not the auth object', async () => {
    const custom = cognitoForms.actions()['custom_api_call'];
    expect(custom).toBeDefined();
    const calls = stubFetch([{ body: [] }]);
    await run({ action: custom, props: { url: { url: `${BASE}/forms` }, method: 'GET', headers: {}, queryParams: {}, failsafe: false } });
    expect(calls[0].headers['authorization']).toBe(`Bearer ${KEY}`);
  });
});

describe('custom api call', () => {
  const custom = () => cognitoForms.actions()['custom_api_call'];
  const props = (url: string) => ({ url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false });

  it('uses the TLS-verifying dispatcher and resolves relative paths', async () => {
    const inits: RequestInit[] = [];
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL, init?: RequestInit) => {
      urls.push(String(input));
      inits.push(init ?? {});
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    }));
    await run({ action: custom(), props: props('/forms') });
    const { Agent } = await import('undici');
    expect(urls[0]).toBe(`${BASE}/forms`);
    expect(Reflect.get(inits[0], 'dispatcher')).toBeInstanceOf(Agent);
  });

  it.each([
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'output.docx'],
    ['application/msword; charset=binary', 'output.doc'],
    ['application/vnd.ms-excel', 'output.xls'],
    ['application/x-unknown', 'output.txt'],
  ])('names binary %s responses %s', async (contentType, fileName) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': contentType } })));
    const { output, written } = await run({ action: custom(), props: { ...props('/forms'), response_is_binary: true } });
    expect(written.map((w) => w.fileName)).toEqual([fileName]);
    expect(Reflect.get(Object(output), 'body')).toBe(`file://${fileName}`);
  });

  it('refuses other hosts and dot segments', async () => {
    stubFetch([]);
    await expect(run({ action: custom(), props: props('https://evil.example/api/forms') })).rejects.toThrow('must be on');
    await expect(run({ action: custom(), props: props('http://www.cognitoforms.com/api/forms') })).rejects.toThrow('must be on');
    await expect(run({ action: custom(), props: props('/forms/../../x') })).rejects.toThrow('..');
  });
});

describe('auth validate', () => {
  const validate = cognitoFormsAuth.validate;
  it('accepts a working key', async () => {
    stubFetch([{ body: [] }]);
    expect(await validate?.({ auth: KEY, server: { apiUrl: '', publicUrl: '' } })).toEqual({ valid: true });
  });
  it('reports 401 as invalid key and 403 as missing scope', async () => {
    stubFetch([{ status: 401, body: { Message: 'AccessToken invalid.' } }, { status: 403, body: { Message: 'nope' } }]);
    const r401 = await validate?.({ auth: KEY, server: { apiUrl: '', publicUrl: '' } });
    expect(r401?.valid).toBe(false);
    expect(r401?.error).toContain('Invalid API key');
    const r403 = await validate?.({ auth: KEY, server: { apiUrl: '', publicUrl: '' } });
    expect(r403?.error).toContain('Read scope');
  });
});

describe('human entry actions', () => {
  it('create strips empty values and posts to the form', async () => {
    const calls = stubFetch([{ body: sampleEntry }]);
    const { output } = await run({ action: createEntryAction, props: { formId: '5', entryData: { Email: 'a@b.co', Phone: '', Note: undefined, Agree: false, Tags: [] } } });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe(`${BASE}/forms/5/entries`);
    expect(calls[0].body).toEqual({ Email: 'a@b.co', Agree: false });
    expect(output).toEqual(sampleEntry);
  });

  it('update PATCHes only filled values and refuses an empty update', async () => {
    const calls = stubFetch([{ body: sampleEntry }]);
    await run({ action: updateEntryAction, props: { formId: '5', entryId: ' 12 ', entryData: { Email: 'x@y.co', Name: '' } } });
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe(`${BASE}/forms/5/entries/12`);
    expect(calls[0].body).toEqual({ Email: 'x@y.co' });
    await expect(run({ action: updateEntryAction, props: { formId: '5', entryId: '12', entryData: { Name: '' } } })).rejects.toThrow('at least one field');
  });

  it('delete treats a missing entry as already deleted but not a missing form', async () => {
    stubFetch([{ status: 204 }, { status: 404, body: { Type: 'EntryNotFound', Message: 'Entry not found.' } }, { status: 404, body: { Type: 'FormNotFound', Message: 'Form not found.' } }]);
    expect((await run({ action: deleteEntryAction, props: { formId: '5', entryId: '12' } })).output).toEqual({ deleted: true, already_deleted: false, form_id: '5', entry_id: '12' });
    expect((await run({ action: deleteEntryAction, props: { formId: '5', entryId: '12' } })).output).toEqual({ deleted: true, already_deleted: true, form_id: '5', entry_id: '12' });
    await expect(run({ action: deleteEntryAction, props: { formId: '9', entryId: '12' } })).rejects.toThrow('Form not found');
  });

  it('delete fails on a 404 that is not EntryNotFound', async () => {
    stubFetch([{ status: 404, body: { Message: 'Not found.' } }]);
    await expect(run({ action: deleteEntryAction, props: { formId: '9', entryId: '12' } })).rejects.toThrow();
  });
});

describe('ai entry actions', () => {
  it('create parses JSON fields and normalizes output', async () => {
    const calls = stubFetch([{ body: sampleEntry }]);
    const { output } = await run({ action: createEntryAiAction, props: { form_id: 'ContactUs', fields: '{"Email":"ada@example.com","Name":{"First":"Ada"}}' } });
    expect(calls[0].body).toEqual({ Email: 'ada@example.com', Name: { First: 'Ada' } });
    expect(output).toMatchObject({ entry_id: '1-12', entry_number: 12, status: 'Submitted', form_name: 'Contact Us', internal_link: 'https://www.cognitoforms.com/acme/ContactUs#internal-link-token' });
  });

  it('create rejects non-object fields', async () => {
    stubFetch([]);
    await expect(run({ action: createEntryAiAction, props: { form_id: '5', fields: '[1]' } })).rejects.toThrow('JSON object');
    await expect(run({ action: createEntryAiAction, props: { form_id: '5', fields: '{bad' } })).rejects.toThrow('not valid JSON');
  });

  it('update sends null to clear a field', async () => {
    const calls = stubFetch([{ body: sampleEntry }]);
    await run({ action: updateEntryAiAction, props: { form_id: '5', entry_id: '5-12', fields: { Message: null } } });
    expect(calls[0].url).toBe(`${BASE}/forms/5/entries/5-12`);
    expect(calls[0].body).toEqual({ Message: null });
  });

  it('get encodes path segments', async () => {
    const calls = stubFetch([{ body: sampleEntry }]);
    await run({ action: getEntryAiAction, props: { form_id: 'a/b', entry_id: '1' } });
    expect(calls[0].url).toBe(`${BASE}/forms/a%2Fb/entries/1`);
  });

  it('delete ai shares the delete logic', async () => {
    stubFetch([{ status: 204 }]);
    expect((await run({ action: deleteEntryAiAction, props: { form_id: '5', entry_id: '1' } })).output).toMatchObject({ deleted: true });
  });
});

describe('form actions', () => {
  it('list forms maps the response', async () => {
    stubFetch([{ body: [{ Id: '5', Name: 'Contact Us', InternalName: 'ContactUs' }] }]);
    expect((await run({ action: listFormsAction, props: {} })).output).toEqual({ count: 1, forms: [{ id: '5', name: 'Contact Us', internal_name: 'ContactUs' }] });
  });

  it('get form schema flattens fields', async () => {
    const schema = {
      type: 'object',
      required: ['Email'],
      properties: {
        Email: { type: 'string', title: 'Email' },
        Size: { type: 'string', enum: ['S', 'M'] },
        Name: { $ref: '#/definitions/Name' },
        Notes: { type: 'string', readOnly: true },
        Id: { type: 'string' },
        Entry: { type: 'object' },
      },
    };
    stubFetch([{ body: schema }]);
    const { output } = await run({ action: getFormSchemaAction, props: { form_id: '5' } });
    expect(output).toMatchObject({
      form_id: '5',
      field_count: 4,
      fields: [
        { name: 'Email', type: 'string', required: true, read_only: false },
        { name: 'Size', allowed_values: ['S', 'M'] },
        { name: 'Name', type: 'object' },
        { name: 'Notes', read_only: true },
      ],
    });
  });

  it('set availability posts only given values and maps the response', async () => {
    const calls = stubFetch([{ body: { AvailabilityStart: null, AvailabilityEnd: '2026-12-01T00:00:00Z', NotAvailableMessage: 'Closed' } }]);
    const { output } = await run({ action: setFormAvailabilityAction, props: { form_id: '5', end: '2026-12-01T00:00:00Z', message: 'Closed' } });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe(`${BASE}/forms/5/public-link-availability`);
    expect(calls[0].body).toEqual({ end: '2026-12-01T00:00:00Z', message: 'Closed' });
    expect(output).toEqual({ form_id: '5', availability_start: null, availability_end: '2026-12-01T00:00:00Z', not_available_message: 'Closed' });
  });

  it('set availability rejects start after end', async () => {
    stubFetch([]);
    await expect(run({ action: setFormAvailabilityAction, props: { form_id: '5', start: '2026-12-02T00:00:00Z', end: '2026-12-01T00:00:00Z' } })).rejects.toThrow('before');
  });
});

describe('files', () => {
  it('download file writes base64 content', async () => {
    stubFetch([{ body: { Id: 'f1', Name: 'a.txt', ContentType: 'text/plain', Size: 5, File: 'https://files.example/a', Content: Buffer.from('hello').toString('base64') } }]);
    const { output, written } = await run({ action: downloadFileAction, props: { file_id: 'f1' } });
    expect(written[0].data.toString()).toBe('hello');
    expect(output).toEqual({ file: 'file://a.txt', file_id: 'f1', file_name: 'a.txt', content_type: 'text/plain', size: 5, url: 'https://files.example/a' });
  });

  it('document falls back to the temporary link without sending the API key', async () => {
    const calls = stubFetch([{ body: { Id: 'd1', Name: 'doc.pdf', ContentType: 'application/pdf', File: 'https://files.example/doc' } }, { body: 'PDF' }]);
    const { written } = await run({ action: getEntryDocumentAction, props: { form_id: '5', entry_id: '12', template_number: 2 } });
    expect(calls[0].url).toBe(`${BASE}/forms/5/entries/12/documents/2`);
    expect(calls[1].headers['authorization']).toBeUndefined();
    expect(written[0].fileName).toBe('doc.pdf');
  });

  it('rejects base64 content over the size cap before decoding', () => {
    const spy = vi.spyOn(Buffer, 'from');
    expect(() => decodeContent('A'.repeat(Math.ceil((MAX_FILE_BYTES * 4) / 3) + 8))).toThrow('larger than');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects a download whose Content-Length is over the cap', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => String(input).startsWith(BASE)
      ? new Response(JSON.stringify({ Id: 'f1', Name: 'a.bin', File: 'https://files.example/a' }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response('x', { status: 200, headers: { 'content-length': String(MAX_FILE_BYTES + 1) } })));
    await expect(run({ action: downloadFileAction, props: { file_id: 'f1' } })).rejects.toThrow('larger than');
  });

  it('aborts a streamed download once it passes the cap', async () => {
    let pulled = 0;
    const chunk = new Uint8Array(8 * 1024 * 1024);
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 40) controller.close();
        else controller.enqueue(chunk);
      },
    });
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => String(input).startsWith(BASE)
      ? new Response(JSON.stringify({ Id: 'f1', Name: 'a.bin', File: 'https://files.example/a' }), { status: 200, headers: { 'content-type': 'application/json' } })
      : new Response(body, { status: 200 })));
    await expect(run({ action: downloadFileAction, props: { file_id: 'f1' } })).rejects.toThrow('larger than');
    expect(pulled).toBeLessThan(20);
  });

  it('document rejects a bad template number', async () => {
    stubFetch([]);
    await expect(run({ action: getEntryDocumentAction, props: { form_id: '5', entry_id: '12', template_number: 0 } })).rejects.toThrow('Template Number');
  });
});

describe('tls', () => {
  it('passes a TLS-verifying undici dispatcher on API and download requests', async () => {
    const inits: RequestInit[] = [];
    const fetchMock = vi.fn(async (_input: string | URL, init?: RequestInit) => {
      inits.push(init ?? {});
      const body = inits.length === 1 ? { Id: 'f1', Name: 'a.txt', File: 'https://files.example/a' } : 'hello';
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    await run({ action: downloadFileAction, props: { file_id: 'f1' } });
    const { Agent } = await import('undici');
    expect(inits).toHaveLength(2);
    for (const init of inits) {
      expect(Reflect.get(init, 'dispatcher')).toBeInstanceOf(Agent);
    }
  });
});

describe('errors', () => {
  it('maps vendor errors to readable messages without a body field', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch([{ status: 400, body: { Type: 'ValidationError', Message: 'Email is invalid.', Data: { Email: 'bad' } } }]);
    const error = await run({ action: createEntryAiAction, props: { form_id: '5', fields: { Email: 'secret-pii@example.com' } } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CognitoFormsApiError);
    expect(String(error)).toContain('Email is invalid.');
    expect(error).not.toHaveProperty('body');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secret-pii@example.com');
  });

  it('429 explains the rate limit', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch([{ status: 429, body: { Message: 'Too many' } }]);
    await expect(run({ action: listFormsAction, props: {} })).rejects.toThrow('rate limit');
  });
});

describe('helpers', () => {
  it('stripEmptyValues keeps false and 0', () => {
    expect(stripEmptyValues({ a: 0, b: false, c: '', d: null, e: {}, f: 'x' })).toEqual({ a: 0, b: false, f: 'x' });
  });

  it('buildFieldProps maps integer, enum and complex types', () => {
    const props = buildFieldProps({
      schema: { properties: {
        Count: { type: 'integer' },
        Size: { type: 'string', enum: ['S'] },
        Address: { type: 'object' },
        Rows: { type: 'array' },
        Maybe: { type: ['null', 'number'] },
        Locked: { type: 'string', readOnly: true },
        Id: { type: 'string' },
      } },
    });
    expect(Object.keys(props)).toEqual(['Count', 'Size', 'Address', 'Rows', 'Maybe']);
    expect(props['Count'].type).toBe('NUMBER');
    expect(props['Size'].type).toBe('STATIC_DROPDOWN');
    expect(props['Address'].type).toBe('JSON');
    expect(props['Maybe'].type).toBe('NUMBER');
  });

  it('buildFieldProps shows Yes/No fields as a dropdown on update, so unset ones are not sent', () => {
    const schema = { properties: { Agree: { type: 'boolean' }, OptIn: { type: ['boolean', 'null'] } } };
    expect(buildFieldProps({ schema })['Agree'].type).toBe('CHECKBOX');
    const props = buildFieldProps({ schema, forUpdate: true });
    expect(props['Agree'].type).toBe('STATIC_DROPDOWN');
    expect(props['OptIn'].type).toBe('STATIC_DROPDOWN');
    expect(stripEmptyValues({ Agree: undefined, OptIn: false, Status: 'Open' })).toEqual({ OptIn: false, Status: 'Open' });
  });

  it('normalizeEntry moves form fields under fields', () => {
    const entry = normalizeEntry(sampleEntry);
    expect(Object.keys(entry.fields).sort()).toEqual(['Address', 'Email', 'Files', 'Name', 'Phone', 'Signature']);
  });
});

type Call = { method: string; url: string; headers: Record<string, string>; body: unknown };
type Fake = { status?: number; body?: unknown };
