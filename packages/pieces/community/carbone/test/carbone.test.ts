import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { InputPropertyMap, createMockActionContext } from '@activepieces/pieces-framework';
import { carboneClient } from '../src/lib/common/client';
import { carboneAuth } from '../src/lib/auth';
import { renderDocumentAction } from '../src/lib/actions/render-document';
import { listTemplatesAction } from '../src/lib/actions/list-templates';
import { updateTemplateAction } from '../src/lib/actions/update-template';
import { uploadTemplateAction } from '../src/lib/actions/upload-template';
import { convertDocumentAction } from '../src/lib/actions/convert-document';
import { getRenderResultAction } from '../src/lib/actions/get-render-result';
import { getTemplateAction } from '../src/lib/actions/get-template';
import { listTemplateVersionsAction } from '../src/lib/actions/list-template-versions';
import { getStatusAction } from '../src/lib/actions/get-status';
import { downloadTemplateAction } from '../src/lib/actions/download-template';
import { renderInlineTemplateAction } from '../src/lib/actions/render-inline-template';
import { carboneProps } from '../src/lib/common/props';
import { carboneCustomApiCall } from '../src/lib/actions/custom-api-call';
import { listCategoriesAction } from '../src/lib/actions/list-categories';
import { listTagsAction } from '../src/lib/actions/list-tags';
import { deleteTemplateAction } from '../src/lib/actions/delete-template';
import { carbone } from '../src/index';

const auth = { type: 'SECRET_TEXT', secret_text: 'key-123' };

function ctx(propsValue: Record<string, unknown>) {
  const written: Array<{ fileName: string; data: Buffer }> = [];
  return {
    written,
    context: {
      auth,
      propsValue,
      files: {
        write: async (p: { fileName: string; data: Buffer }) => {
          written.push(p);
          return `https://files/${p.fileName}`;
        },
      },
    },
  };
}

const SERVER = { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 't' };

function mockSend(impl: (req: HttpRequest) => HttpResponse) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => impl(req));
}

function runAction({ action, context }: { action: { run: unknown }; context: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, ...context }]));
}

function formText(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'getBuffer' in body && typeof body.getBuffer === 'function') {
    return String(Reflect.apply(body.getBuffer, body, []));
  }
  throw new Error('body is not form-data');
}

function fileResponse(name: string) {
  return {
    status: 200,
    headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}` },
    body: Buffer.from('PDF'),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('client', () => {
  it('sends auth + carbone-version and redacts body', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [] } }));
    await carboneClient.request({ apiKey: ' k ', method: HttpMethod.GET, path: '/templates', operation: 'x' });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.carbone.io/templates');
    expect(req.headers).toMatchObject({ Authorization: 'Bearer k', 'carbone-version': '5' });
    expect(req.redactBodyInErrors).toBe(true);
  });

  it('maps HttpError to vendor message without request body', async () => {
    mockSend(() => {
      throw new HttpError({ data: { secret: 'PII' } }, { status: 404, responseBody: { success: false, error: 'Template not found' } });
    });
    const err = await carboneClient
      .request({ apiKey: 'k', method: HttpMethod.POST, path: '/render/1', operation: 'render document', body: { data: { secret: 'PII' } } })
      .catch((e: Error) => e);
    expect(String(err)).toContain('Carbone render document failed (404): Template not found');
    expect(String(err)).not.toContain('PII');
  });

  it('maps a string buffer error body', async () => {
    mockSend(() => {
      throw new HttpError(undefined, { status: 400, responseBody: Buffer.from('{"success":false,"error":"bad"}') });
    });
    await expect(carboneClient.request({ apiKey: 'k', method: HttpMethod.GET, path: '/x', operation: 'op' })).rejects.toThrow('Carbone op failed (400): bad');
  });

  it('maps network errors and warns on POST', async () => {
    mockSend(() => {
      throw new Error('aborted');
    });
    await expect(carboneClient.request({ apiKey: 'k', method: HttpMethod.POST, path: '/x', operation: 'op' })).rejects.toThrow(/may still have been applied/);
  });

  it('throws on 200 with success:false', async () => {
    mockSend(() => ({ status: 200, headers: {}, body: { success: false, error: 'nope' } }));
    await expect(carboneClient.request({ apiKey: 'k', method: HttpMethod.GET, path: '/x', operation: 'op' })).rejects.toThrow('nope');
  });

  it('parses convertTo', () => {
    expect(carboneClient.parseConvertTo('pdf')).toBe('pdf');
    expect(carboneClient.parseConvertTo(' ')).toBeUndefined();
    expect(carboneClient.parseConvertTo('{"formatName":"pdf","formatOptions":{"Watermark":"X"}}')).toEqual({ formatName: 'pdf', formatOptions: { Watermark: 'X' } });
    expect(() => carboneClient.parseConvertTo('{"x":1}')).toThrow(/formatName/);
  });

  it('parses filenames', () => {
    expect(carboneClient.parseFilename({ contentDisposition: 'attachment; filename="a b.pdf"', fallback: 'f' })).toBe('a b.pdf');
    expect(carboneClient.parseFilename({ contentDisposition: "attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf", fallback: 'f' })).toBe('résumé.pdf');
    expect(carboneClient.parseFilename({ contentDisposition: 'attachment; filename="../../etc/x.pdf"', fallback: 'f' })).toBe('x.pdf');
    expect(carboneClient.parseFilename({ contentDisposition: undefined, fallback: 'f' })).toBe('f');
  });
});

describe('auth', () => {
  it('invalid only on 401', async () => {
    mockSend(() => {
      throw new HttpError(undefined, { status: 401, responseBody: { success: false, error: 'Unauthorized' } });
    });
    const r = await carboneAuth.validate?.({ auth: 'bad', server: SERVER });
    expect(r).toEqual({ valid: false, error: 'Invalid API key' });
  });
  it('surfaces 5xx', async () => {
    mockSend(() => {
      throw new HttpError(undefined, { status: 503, responseBody: 'down' });
    });
    const r = await carboneAuth.validate?.({ auth: 'k', server: SERVER });
    expect(r).toEqual({ valid: false, error: 'Carbone validate connection failed (503): down' });
  });
});

describe('actions', () => {
  it('render sends object convertTo and saves file', async () => {
    const spy = mockSend(() => fileResponse('out.pdf'));
    const { context, written } = ctx({ templateId: 'T1', data: { name: 'A' }, convertTo: '{"formatName":"pdf"}' });
    const out = await runAction({ action: renderDocumentAction, context: context });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.carbone.io/render/T1');
    expect(req.queryParams).toEqual({ download: 'true' });
    expect(req.body).toEqual({ data: { name: 'A' }, lang: 'en-us', timezone: 'UTC', convertTo: { formatName: 'pdf' } });
    expect(out).toEqual({ filename: 'out.pdf', contentType: 'application/pdf', sizeBytes: 3, file: 'https://files/out.pdf' });
    expect(written[0].fileName).toBe('out.pdf');
  });

  it('render rejects data that is not an object or array', async () => {
    mockSend(() => fileResponse('x'));
    const { context } = ctx({ templateId: 'T1', data: 5 });
    await expect(runAction({ action: renderDocumentAction, context: context })).rejects.toThrow('Data must be a JSON object or array.');
  });

  it('render accepts an array as root data', async () => {
    const spy = mockSend(() => fileResponse('x.pdf'));
    const { context } = ctx({ templateId: 'T1', data: [{ a: 1 }] });
    await runAction({ action: renderDocumentAction, context: context });
    expect(spy.mock.calls[0][0].body).toMatchObject({ data: [{ a: 1 }] });
  });

  it('render accepts a numeric template id from an agent', async () => {
    const spy = mockSend(() => fileResponse('x.pdf'));
    const { context } = ctx({ templateId: 1562122300338599, data: {} });
    await runAction({ action: renderDocumentAction, context: context });
    expect(spy.mock.calls[0][0].url).toBe('https://api.carbone.io/render/1562122300338599');
  });

  it('inline render sends base64 template', async () => {
    const spy = mockSend(() => fileResponse('o.pdf'));
    const { context } = ctx({ template: { base64: 'QUJD', filename: 't.docx' }, data: {}, convertTo: 'pdf' });
    await runAction({ action: renderInlineTemplateAction, context: context });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.carbone.io/render/template');
    expect(req.body).toMatchObject({ template: 'QUJD', convertTo: 'pdf', data: {} });
  });

  it('convert sends no data so Carbone only converts', async () => {
    const spy = mockSend(() => fileResponse('o.pdf'));
    const { context } = ctx({ file: { base64: 'QUJD' }, convertTo: 'pdf', converter: 'O' });
    await runAction({ action: convertDocumentAction, context: context });
    expect(spy.mock.calls[0][0].body).toEqual({ template: 'QUJD', convertTo: 'pdf', converter: 'O' });
  });

  it('get render result GETs /render/:id', async () => {
    const spy = mockSend(() => fileResponse('r.pdf'));
    const { context } = ctx({ renderId: 'abc' });
    const out = await runAction({ action: getRenderResultAction, context: context });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'GET', url: 'https://api.carbone.io/render/abc', responseType: 'arraybuffer' });
    expect(out).toMatchObject({ filename: 'r.pdf' });
  });

  it('download template', async () => {
    const spy = mockSend(() => fileResponse('t.docx'));
    const { context } = ctx({ templateId: '42' });
    const out = await runAction({ action: downloadTemplateAction, context: context });
    expect(spy.mock.calls[0][0].url).toBe('https://api.carbone.io/template/42');
    expect(out).toMatchObject({ templateId: '42', filename: 't.docx' });
  });

  it('list templates omits includeVersions when false', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [{ id: '1' }], hasMore: true, nextCursor: 'c2' } }));
    const { context } = ctx({ includeVersions: false, limit: 5 });
    const out = await runAction({ action: listTemplatesAction, context: context });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ limit: '5' });
    expect(out).toEqual({ templates: [{ id: '1' }], hasMore: true, nextCursor: 'c2', count: 1 });
  });

  it('get template errors when none', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [] } }));
    const { context } = ctx({ templateId: '9' });
    await expect(runAction({ action: getTemplateAction, context: context })).rejects.toThrow(/no template found/);
    expect(spy.mock.calls[0][0].queryParams).toEqual({ id: '9', limit: '1' });
  });

  it('list template versions', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [{ id: '9', versionId: 'v' }], hasMore: false } }));
    const { context } = ctx({ templateId: '9' });
    const out = await runAction({ action: listTemplateVersionsAction, context: context });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ id: '9', includeVersions: 'true' });
    expect(out).toEqual({ versions: [{ id: '9', versionId: 'v' }], count: 1, hasMore: false, nextCursor: null });
  });

  it('update validates timestamps and empty update', async () => {
    mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    await expect(runAction({ action: updateTemplateAction, context: ctx({ templateId: '1', deployedAt: 'soon' }).context })).rejects.toThrow(/Unix timestamp/);
    await expect(runAction({ action: updateTemplateAction, context: ctx({ templateId: '1' }).context })).rejects.toThrow(/at least one field/);
  });

  it('update drops an empty tag list so saved tags are kept', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    await runAction({ action: updateTemplateAction, context: ctx({ templateId: '1', name: 'N', tags: [] }).context });
    expect(spy.mock.calls[0][0].body).toEqual({ name: 'N' });
    await expect(runAction({ action: updateTemplateAction, context: ctx({ templateId: '1', tags: [] }).context })).rejects.toThrow(/at least one field/);
  });

  it('update sends only set fields', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    await runAction({ action: updateTemplateAction, context: ctx({ templateId: '1', name: 'N', tags: [{ tag: 'a' }], expireAt: '42000000000' }).context });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'PATCH', body: { name: 'N', tags: ['a'], expireAt: 42000000000 } });
  });

  it('upload puts metadata before the file', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: { id: '7', versionId: 'v', type: 'docx', size: 3, createdAt: 1 } } }));
    const out = await runAction({ action: uploadTemplateAction, context: ctx({ file: { base64: 'QUJD' }, filename: 't.docx', versioning: true, name: 'N', tags: [{ tag: 'x' }] }).context });
    const text = formText(spy.mock.calls[0][0].body);
    expect(text.indexOf('name="name"')).toBeLessThan(text.indexOf('name="template"'));
    expect(text.indexOf('name="tags"')).toBeLessThan(text.indexOf('name="template"'));
    expect(out).toMatchObject({ templateId: '7', versionId: 'v' });
  });

  it('get status', async () => {
    mockSend(() => ({ status: 200, headers: {}, body: { success: true, code: 200, message: 'OK', version: '5.0.0' } }));
    const out = await runAction({ action: getStatusAction, context: ctx({}).context });
    expect(out).toEqual({ success: true, code: 200, message: 'OK', version: '5.0.0' });
  });

  it('upload sends versioning=true by default', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: { id: '7' } } }));
    await runAction({ action: uploadTemplateAction, context: ctx({ file: { base64: 'QUJD' }, filename: 't.docx' }).context });
    const text = formText(spy.mock.calls[0][0].body);
    expect(text).toMatch(/name="versioning"\r\n\r\ntrue/);
    expect(text.indexOf('name="versioning"')).toBeLessThan(text.indexOf('name="template"'));
  });

  it('get template treats a non-numeric id as versionId', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [{ id: null, versionId: 'abc123' }] } }));
    const out = await runAction({ action: getTemplateAction, context: ctx({ templateId: 'abc123' }).context });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ versionId: 'abc123', limit: '1' });
    expect(out).toEqual({ id: null, versionId: 'abc123' });
  });

  it('list template versions treats a non-numeric id as versionId', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [] } }));
    await runAction({ action: listTemplateVersionsAction, context: ctx({ templateId: 'abc123' }).context });
    expect(spy.mock.calls[0][0].queryParams).toMatchObject({ versionId: 'abc123' });
    expect(spy.mock.calls[0][0].queryParams).not.toHaveProperty('id');
  });
});

describe('template dropdown', () => {
  it('falls back to versionId for null id and skips entries without ids', async () => {
    mockSend(() => ({
      status: 200,
      headers: {},
      body: {
        success: true,
        hasMore: false,
        data: [
          { id: '1', versionId: 'v1', name: 'Invoice' },
          { id: null, versionId: 'v2', name: 'Legacy' },
          { id: null, versionId: null, name: 'Broken' },
        ],
      },
    }));
    const dropdown = carboneProps.templateDropdown({ displayName: 'T', description: 'd' });
    const result = await Promise.resolve(Reflect.apply(dropdown.options, dropdown, [{ auth }, {}]));
    expect(result.options).toEqual([
      { label: 'Invoice (1)', value: '1' },
      { label: 'Legacy (v2)', value: 'v2' },
    ]);
  });
});

describe('gap round', () => {
  it('throws when a file response is JSON with success:false, without a (200) label', async () => {
    mockSend(() => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: Buffer.from('{"success":false,"error":"Render failed"}'),
    }));
    const { context, written } = ctx({ templateId: 'T1', data: {} });
    const err = await runAction({ action: renderDocumentAction, context: context }).catch((e: Error) => e);
    expect(String(err)).toContain('Carbone render document failed: Render failed');
    expect(String(err)).not.toContain('(200)');
    expect(written).toHaveLength(0);
  });

  it('keeps a binary file response that is not JSON', async () => {
    mockSend(() => fileResponse('ok.pdf'));
    const { context, written } = ctx({ templateId: 'T1', data: {} });
    await runAction({ action: renderDocumentAction, context: context });
    expect(written).toHaveLength(1);
  });

  it('upload with existing template id sends deployedAt=42000000000 before the file', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: { id: '7', versionId: 'v2' } } }));
    await runAction({ action: uploadTemplateAction, context: ctx({ file: { base64: 'QUJD' }, filename: 't.docx', existingTemplateId: '7' }).context });
    const text = formText(spy.mock.calls[0][0].body);
    expect(text).toMatch(/name="id"\r\n\r\n7/);
    expect(text).toMatch(/name="deployedAt"\r\n\r\n42000000000/);
    expect(text.indexOf('name="deployedAt"')).toBeLessThan(text.indexOf('name="template"'));
  });

  it('upload without existing template id sends no deployedAt', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: { id: '7' } } }));
    await runAction({ action: uploadTemplateAction, context: ctx({ file: { base64: 'QUJD' }, filename: 't.docx' }).context });
    const text = formText(spy.mock.calls[0][0].body);
    expect(text).not.toContain('name="deployedAt"');
  });
});

describe('review fixes', () => {
  function dropdownOptions({ search }: { search?: string } = {}) {
    const dropdown = carboneProps.templateDropdown({ displayName: 'T', description: 'd' });
    return Promise.resolve(Reflect.apply(dropdown.options, dropdown, [{ auth }, { searchValue: search }]));
  }

  it('dropdown follows the cursor across pages', async () => {
    const spy = mockSend((req) => {
      const cursor = req.queryParams?.['cursor'];
      return cursor === 'c2'
        ? { status: 200, headers: {}, body: { success: true, hasMore: false, data: [{ id: '2', versionId: 'v2', name: 'B' }] } }
        : { status: 200, headers: {}, body: { success: true, hasMore: true, nextCursor: 'c2', data: [{ id: '1', versionId: 'v1', name: 'A' }] } };
    });
    const result = await dropdownOptions();
    expect(result.options.map((o: { value: string }) => o.value)).toEqual(['1', '2']);
    expect(result.placeholder).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('dropdown says the list is cut after 5 pages and sends the search text', async () => {
    let page = 0;
    const spy = mockSend(() => {
      page++;
      return { status: 200, headers: {}, body: { success: true, hasMore: true, nextCursor: `c${page}`, data: [{ id: String(page), versionId: `v${page}`, name: 'N' }] } };
    });
    const result = await dropdownOptions({ search: ' inv ' });
    expect(spy).toHaveBeenCalledTimes(5);
    expect(result.options).toHaveLength(5);
    expect(result.placeholder).toContain('Type to search');
    expect(spy.mock.calls[0][0].queryParams).toMatchObject({ search: 'inv' });
  });

  it('dropdown stops when hasMore has no cursor', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, hasMore: true, data: [] } }));
    await dropdownOptions();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('readTags keeps strings, {tag} objects and numbers', () => {
    expect(carboneProps.readTags([' a ', { tag: 'b' }, { tag: 2024 }, 7, '', null])).toEqual(['a', 'b', '2024', '7']);
  });

  it('update rejects a millisecond timestamp', async () => {
    mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    const { context } = ctx({ templateId: 'T1', expireAt: '1767225600000' });
    await expect(runAction({ action: updateTemplateAction, context: context })).rejects.toThrow('milliseconds');
  });

  it('update trims text fields and skips blank ones', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    const { context } = ctx({ templateId: 'T1', name: '  New  ', comment: '   ', category: '' });
    await runAction({ action: updateTemplateAction, context: context });
    expect(spy.mock.calls[0][0].body).toEqual({ name: 'New' });
  });

  it('list templates trims filters and rejects a limit over 100', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: [] } }));
    await runAction({ action: listTemplatesAction, context: ctx({ id: ' 12 ', cursor: ' c \n' }).context });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ id: '12', cursor: 'c' });
    await expect(runAction({ action: listTemplatesAction, context: ctx({ limit: 500 }).context })).rejects.toThrow('1 to 100');
  });

  it('filename ".." falls back and a JSON string error loses its quotes', () => {
    expect(carboneClient.parseFilename({ contentDisposition: 'attachment; filename=".."', fallback: 'f' })).toBe('f');
    expect(carboneClient.readVendorMessage('"plain"')).toBe('plain');
  });

  it('custom API call keeps the key on api.carbone.io and redacts bodies', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { ok: true } }));
    const run = (url: string) =>
      runAction({ action: carboneCustomApiCall, context: ctx({ url: { url }, method: HttpMethod.GET }).context });
    await run('/templates');
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.carbone.io/templates');
    expect(req.headers).toMatchObject({ Authorization: 'Bearer key-123', 'carbone-version': '5' });
    expect(req.redactBodyInErrors).toBe(true);
    await expect(run('https://evil.example.com/x')).rejects.toThrow('must be on https://api.carbone.io');
  });

  it('custom API call returns status and body only and blocks encoded parent segments', async () => {
    mockSend(() => ({ status: 200, headers: { 'x-a': '1' }, body: { ok: true } }));
    const out = await runAction({ action: carboneCustomApiCall, context: ctx({ url: { url: '/status' }, method: HttpMethod.GET }).context });
    expect(out).toEqual({ status: 200, headers: { 'x-a': '1' }, body: { ok: true } });
    await expect(
      runAction({ action: carboneCustomApiCall, context: ctx({ url: { url: '/template/.%2e/x' }, method: HttpMethod.GET }).context })
    ).rejects.toThrow('".." segments');
  });

  it('update accepts a zero-padded seconds timestamp', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    await runAction({ action: updateTemplateAction, context: ctx({ templateId: 'T1', expireAt: '0001767225600' }).context });
    expect(spy.mock.calls[0][0].body).toEqual({ expireAt: 1767225600 });
  });

  it('upload trims metadata and skips blank values', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true, data: { id: '1' } } }));
    await runAction({ action: uploadTemplateAction, context: ctx({ file: { base64: 'QUJD' }, filename: 't.docx', name: '  N  ', comment: '   ' }).context });
    const text = formText(spy.mock.calls[0][0].body);
    expect(text).toContain('\r\n\r\nN\r\n');
    expect(text).not.toContain('name="comment"');
  });

  it('list categories and list tags map names and count', async () => {
    const spy = mockSend((req) => ({ status: 200, headers: {}, body: { success: true, data: req.url.endsWith('/tags') ? [{ name: 't1' }] : [{ name: 'c1' }, { name: 'c2' }] } }));
    expect(await runAction({ action: listCategoriesAction, context: ctx({}).context })).toEqual({ categories: ['c1', 'c2'], count: 2 });
    expect(await runAction({ action: listTagsAction, context: ctx({}).context })).toEqual({ tags: ['t1'], count: 1 });
    expect(spy.mock.calls.map((c) => c[0].url)).toEqual(['https://api.carbone.io/templates/categories', 'https://api.carbone.io/templates/tags']);
  });

  it('list categories returns an empty list when data is missing', async () => {
    mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    expect(await runAction({ action: listCategoriesAction, context: ctx({}).context })).toEqual({ categories: [], count: 0 });
  });

  it('custom API call sends json and raw bodies and saves binary responses', async () => {
    const spy = mockSend((req) =>
      req.responseType === 'arraybuffer'
        ? { status: 200, headers: {}, body: Buffer.from('PDF') }
        : { status: 201, headers: {}, body: { ok: true } }
    );
    const call = (props: Record<string, unknown>) =>
      runAction({ action: carboneCustomApiCall, context: ctx({ url: { url: 'https://api.carbone.io/render/T1' }, ...props }).context });
    await call({ method: HttpMethod.POST, body_type: 'json', body: { data: { data: { a: 1 } } }, headers: { 'X-A': 'b' }, queryParams: { download: true } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'POST', body: { data: { a: 1 } }, headers: { 'X-A': 'b' }, queryParams: { download: 'true' } });
    await call({ method: HttpMethod.POST, body_type: 'raw', body: { data: 'text' } });
    expect(spy.mock.calls[1][0].body).toBe('text');
    const out = await call({ method: HttpMethod.GET, response_is_binary: true });
    expect(out).toEqual({ status: 200, headers: {}, body: 'https://files/output.bin' });
  });

  it('custom API call follows redirects only on api.carbone.io', async () => {
    const spy = mockSend((req) =>
      req.url.endsWith('/a')
        ? { status: 302, headers: { location: '/b' }, body: '' }
        : req.url.endsWith('/c')
          ? { status: 302, headers: { location: 'https://evil.example.com/x' }, body: '' }
          : { status: 200, headers: {}, body: { ok: true } }
    );
    const call = ({ url, followRedirects }: { url: string; followRedirects: boolean }) =>
      runAction({ action: carboneCustomApiCall, context: ctx({ url: { url }, method: HttpMethod.GET, followRedirects }).context });
    expect(await call({ url: '/a', followRedirects: true })).toMatchObject({ status: 200, body: { ok: true } });
    expect(spy.mock.calls[1][0].url).toBe('https://api.carbone.io/b');
    expect(await call({ url: '/a', followRedirects: false })).toMatchObject({ status: 302 });
    await expect(call({ url: '/c', followRedirects: true })).rejects.toThrow('redirected the request to https://evil.example.com/x');
  });

  it('custom API call sends form data with text and file fields', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: {} }));
    await runAction({
      action: carboneCustomApiCall,
      context: ctx({
        url: { url: '/template' },
        method: HttpMethod.POST,
        body_type: 'form_data',
        body: { data: [
          { fieldName: 'name', fieldType: 'text', textFieldValue: 'N' },
          { fieldName: 'template', fieldType: 'file', fileFieldValue: { data: Buffer.from('ABC'), filename: 't.docx' } },
          { fieldType: 'text', textFieldValue: 'skipped' },
        ] },
      }).context,
    });
    const form = spy.mock.calls[0][0].body;
    if (!(form instanceof FormData)) {
      throw new Error('body is not FormData');
    }
    expect(form.get('name')).toBe('N');
    expect(form.get('template')).toBeInstanceOf(Blob);
    expect([...form.keys()]).toEqual(['name', 'template']);
  });

  it('delete template encodes the id and returns a summary', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: { success: true } }));
    const out = await runAction({ action: deleteTemplateAction, context: ctx({ templateId: ' a/b ' }).context });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'DELETE', url: 'https://api.carbone.io/template/a%2Fb' });
    expect(out).toEqual({ success: true, templateId: 'a/b', message: 'Template a/b deleted successfully.' });
  });

  it('delete template fails on a success:false body', async () => {
    mockSend(() => ({ status: 200, headers: {}, body: { success: false, error: 'Template not found' } }));
    await expect(runAction({ action: deleteTemplateAction, context: ctx({ templateId: 'T1' }).context })).rejects.toThrow('Template not found');
  });

  it('the piece registers every action', () => {
    expect(Object.keys(carbone.actions()).sort()).toEqual([
      'carbone_convert_document', 'carbone_delete_template', 'carbone_download_template', 'carbone_get_render_result',
      'carbone_get_status', 'carbone_get_template', 'carbone_list_categories', 'carbone_list_tags',
      'carbone_list_template_versions', 'carbone_list_templates', 'carbone_render_document',
      'carbone_render_inline_template', 'carbone_update_template', 'carbone_upload_template', 'custom_api_call',
    ]);
  });

  it('render accepts a non-string converter value', async () => {
    const spy = mockSend(() => fileResponse('x.pdf'));
    await runAction({ action: renderDocumentAction, context: ctx({ templateId: 'T1', data: {}, converter: 7 }).context });
    expect(spy.mock.calls[0][0].body).toMatchObject({ converter: '7' });
  });

  it('custom API call switches to GET without a body after a 303 and sends query params once', async () => {
    const spy = mockSend((req) =>
      req.url.endsWith('/start') ? { status: 303, headers: { location: '/done?x=1' }, body: '' } : { status: 200, headers: {}, body: { ok: true } }
    );
    await runAction({
      action: carboneCustomApiCall,
      context: ctx({ url: { url: '/start' }, method: HttpMethod.POST, body_type: 'json', body: { data: { a: 1 } }, queryParams: { x: '1' }, followRedirects: true }).context,
    });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'POST', body: { a: 1 }, queryParams: { x: '1' } });
    expect(spy.mock.calls[1][0]).toMatchObject({ method: 'GET', url: 'https://api.carbone.io/done?x=1', queryParams: {} });
    expect(spy.mock.calls[1][0].body).toBeUndefined();
  });

  it('custom API call passes the timeout in ms and returns the error as output when failsafe is on', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('boom'));
    const out = await runAction({
      action: carboneCustomApiCall,
      context: ctx({ url: { url: '/status' }, method: HttpMethod.GET, timeout: 5, failsafe: true }).context,
    });
    expect(spy.mock.calls[0][0].timeout).toBe(5000);
    expect(JSON.stringify(out)).toContain('boom');
  });

  it('custom API call sends a scalar JSON body as JSON text', async () => {
    const spy = mockSend(() => ({ status: 200, headers: {}, body: {} }));
    await runAction({ action: carboneCustomApiCall, context: ctx({ url: { url: '/x' }, method: HttpMethod.POST, body_type: 'json', body: { data: 42 } }).context });
    expect(spy.mock.calls[0][0].body).toBe('42');
  });
});
