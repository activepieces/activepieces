import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatalabTiming } from '../src/lib/common/client';
import { datalabSource } from '../src/lib/common/source';
import { formFieldsOperation } from '../src/lib/operations/form-fields';

function fakeTiming(): DatalabTiming {
  let clock = 0;
  return {
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
  };
}

function fakeFiles() {
  return { write: vi.fn(async () => 'https://cloud.activepieces.com/api/v1/files/x'), upload: vi.fn() };
}

function ok(body: unknown) {
  return { status: 200, body };
}

function formOf(body: unknown): FormData {
  if (!(body instanceof FormData)) {
    throw new Error('expected a FormData body');
  }
  return body;
}

const submitted = ok({ success: true, error: null, request_id: 'req_ff', request_check_url: 'https://www.datalab.to/api/v1/form-fields/req_ff' });

const pageText = 'New Employee Information Form\nPlease complete all fields in block capitals.\nFull Name:\nEmail Address:';

const acroResult = {
  progress_percent: 100,
  status: 'complete',
  result_url: null,
  expires_in: null,
  success: true,
  error: '',
  pages: [
    {
      page: 0,
      fields: [
        { field_type: 'name', bbox: [0.36, 0.162, 0.882, 0.187], label: 'Full Name:', name: '' },
        { field_type: 'email', bbox: [0.36, 0.212, 0.882, 0.237], label: 'Email Address:', name: '' },
        { field_type: 'checkbox', bbox: [0.408, 0.419, 0.432, 0.437], label: 'I agree to the company handbook:', name: '' },
      ],
      error: '',
      text: pageText,
    },
  ],
  text_error: '',
  page_count: 1,
  total_cost: 0.533,
  cost_breakdown: { final_cost_cents: 0.533 },
  runtime: 2.164097785949707,
  versions: null,
  json: '{"children":[{"html":"<h1>New Employee Information Form</h1>"}]}',
};

const flatPngResult = {
  progress_percent: 100,
  status: 'complete',
  result_url: null,
  expires_in: null,
  success: true,
  error: '',
  pages: [
    {
      page: 0,
      fields: [
        { field_type: 'date', bbox: [0.36, 0.246, 0.883, 0.283], label: 'Start Date:', name: '' },
        { field_type: 'title', bbox: [0.36, 0.297, 0.883, 0.334], label: 'Job Title:', name: '' },
      ],
      error: '',
      text: null,
    },
  ],
  text_error: '',
  page_count: 1,
  total_cost: 0.4,
  cost_breakdown: { final_cost_cents: 0.4 },
  runtime: 0.9778196811676025,
  versions: null,
  json: null,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('run', () => {
  it('sends a human run with an uploaded file and include_text as a string boolean', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(acroResult));
    const output = await formFieldsOperation.run({
      apiKey: 'key_1',
      audience: 'human',
      source: datalabSource.fromHuman({ source: 'file', input: { file: { filename: 'form', extension: 'pdf', data: Buffer.from('%PDF-1.7 form') } }, noun: 'form' }),
      includeText: true,
      pageRange: '0-1',
      maxPages: 2,
      skipCache: false,
      files: fakeFiles(),
      timing: fakeTiming(),
    });
    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://www.datalab.to/api/v1/form-fields');
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/form-fields/req_ff');
    const form = formOf(request.body);
    const file = form.get('file');
    expect(file instanceof File ? file.name : undefined).toBe('form.pdf');
    expect(form.get('file_url')).toBeNull();
    expect(form.get('include_text')).toBe('true');
    expect(form.get('page_range')).toBe('0-1');
    expect(form.get('max_pages')).toBeNull();
    expect(form.get('skip_cache')).toBe('false');
    expect(output).toMatchObject({ completed: true, status: 'complete', request_id: 'req_ff', field_count: 3, page_count: 1 });
  });

  it('sends an AI run with a URL source and include_text false when omitted', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(flatPngResult));
    await formFieldsOperation.run({
      apiKey: 'k',
      audience: 'ai',
      source: datalabSource.fromAi({ fileUrl: 'https://example.com/forms/flat.png', noun: 'form' }),
      includeText: false,
      pageRange: undefined,
      maxPages: undefined,
      skipCache: false,
      files: fakeFiles(),
      timing: fakeTiming(),
    });
    const form = formOf(spy.mock.calls[0][0].body);
    expect(form.get('file_url')).toBe('https://example.com/forms/flat.png');
    expect(form.get('file')).toBeNull();
    expect(form.get('include_text')).toBe('false');
    expect(form.get('page_range')).toBeNull();
    expect(form.get('max_pages')).toBeNull();
  });

  it('stops before sending on a bad max pages value', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      formFieldsOperation.run({
        apiKey: 'k',
        audience: 'ai',
        source: datalabSource.fromAi({ fileUrl: 'https://example.com/form.pdf', noun: 'form' }),
        includeText: false,
        pageRange: undefined,
        maxPages: 0,
        skipCache: false,
        files: fakeFiles(),
        timing: fakeTiming(),
      }),
    ).rejects.toThrow(/Max Pages/);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('shape', () => {
  it('flattens the AcroForm result into one field list with page text', () => {
    const output = formFieldsOperation.shape({ result: acroResult, files: fakeFiles() });
    expect(output).toEqual({
      fields: [
        { page: 0, label: 'Full Name:', name: '', field_type: 'name', left: 0.36, top: 0.162, right: 0.882, bottom: 0.187 },
        { page: 0, label: 'Email Address:', name: '', field_type: 'email', left: 0.36, top: 0.212, right: 0.882, bottom: 0.237 },
        { page: 0, label: 'I agree to the company handbook:', name: '', field_type: 'checkbox', left: 0.408, top: 0.419, right: 0.432, bottom: 0.437 },
      ],
      field_count: 3,
      pages: [{ page: 0, field_count: 3, text: pageText, error: null }],
      page_count: 1,
    });
    expect(output).not.toHaveProperty('json');
  });

  it('flattens the flat PNG result with text left null', () => {
    const output = formFieldsOperation.shape({ result: flatPngResult, files: fakeFiles() });
    expect(output).toEqual({
      fields: [
        { page: 0, label: 'Start Date:', name: '', field_type: 'date', left: 0.36, top: 0.246, right: 0.883, bottom: 0.283 },
        { page: 0, label: 'Job Title:', name: '', field_type: 'title', left: 0.36, top: 0.297, right: 0.883, bottom: 0.334 },
      ],
      field_count: 2,
      pages: [{ page: 0, field_count: 2, text: null, error: null }],
      page_count: 1,
    });
  });

  it('keeps the same keys on every field across pages, even when Datalab leaves some out', () => {
    const output = formFieldsOperation.shape({
      result: {
        pages: [
          { page: 0, fields: [{ label: 'Signature', bbox: [0.1, 0.2] }], error: 'Could not read page', text: null },
          { page: 1, fields: [{ field_type: 'text', bbox: [0.1, 0.2, 0.3, 0.4], label: 'Notes', name: 'notes' }] },
        ],
      },
      files: fakeFiles(),
    });
    expect(output.fields).toEqual([
      { page: 0, label: 'Signature', name: '', field_type: '', left: null, top: null, right: null, bottom: null },
      { page: 1, label: 'Notes', name: 'notes', field_type: 'text', left: 0.1, top: 0.2, right: 0.3, bottom: 0.4 },
    ]);
    expect(output.pages).toEqual([
      { page: 0, field_count: 1, text: null, error: 'Could not read page' },
      { page: 1, field_count: 1, text: null, error: null },
    ]);
    expect(output.page_count).toBe(2);
  });
});

describe('hasOutput', () => {
  it('is true only when pages is an array', () => {
    expect(formFieldsOperation.hasOutput(acroResult)).toBe(true);
    expect(formFieldsOperation.hasOutput({ status: 'complete', success: true, pages: [] })).toBe(true);
    expect(formFieldsOperation.hasOutput({ status: 'complete', success: true, output_base64: 'abc' })).toBe(false);
    expect(formFieldsOperation.hasOutput({ status: 'complete', success: true, pages: null })).toBe(false);
  });
});
