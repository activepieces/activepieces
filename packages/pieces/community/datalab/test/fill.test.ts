import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatalabAudience, DatalabTiming } from '../src/lib/common/client';
import { datalabSource } from '../src/lib/common/source';
import { fillOperation } from '../src/lib/operations/fill';

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
  return {
    write: vi.fn(async ({ fileName }: { fileName: string; data: unknown }) => `https://cloud.activepieces.com/api/v1/files/${fileName}`),
    upload: vi.fn(),
  };
}

function ok(body: unknown) {
  return { status: 200, body };
}

const pdfBytes = Buffer.from('%PDF-1.7 filled employee form');
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]);

const submitted = ok({ success: true, error: null, request_id: 'req_fill', request_check_url: 'https://www.datalab.to/api/v1/fill/req_fill' });
const processing = ok({ status: 'processing', progress_percent: 10, success: null, error: null, result_url: null });

const acroResult = {
  progress_percent: 100,
  status: 'complete',
  result_url: null,
  expires_in: null,
  success: true,
  error: null,
  output_format: 'pdf',
  output_base64: pdfBytes.toString('base64'),
  fields_filled: ['agree_handbook', 'email', 'full_name', 'start_date'],
  fields_not_found: ['favourite_colour'],
  runtime: 58.07073712348938,
  page_count: 1,
  cost_breakdown: { list_cost_cents: 1.0, final_cost_cents: 1.0, regional_multiplier: 1.0 },
  versions: null,
};

const flatPngResult = {
  progress_percent: 100,
  status: 'complete',
  result_url: null,
  expires_in: null,
  success: true,
  error: null,
  output_format: 'png',
  output_base64: pngBytes.toString('base64'),
  fields_filled: ['Email Address', 'Full Name', 'Job Title'],
  fields_not_found: [],
  runtime: 170.9992425441742,
  page_count: 1,
  cost_breakdown: { final_cost_cents: 11.0 },
  versions: null,
};

function formOf(body: unknown): FormData {
  if (!(body instanceof FormData)) {
    throw new Error('expected a FormData body');
  }
  return body;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('field values', () => {
  it('turns the human field list into field_data, with values as text', () => {
    const fields = fillOperation.fieldsFromList([
      { name: ' Full Name ', value: 'Jane Doe', description: "employee's legal name" },
      { name: 'Age', value: 42 },
      { name: 'agree_handbook', value: true, description: '' },
      { name: 'Middle Name', value: null },
    ]);
    expect(fillOperation.toFieldData(fields)).toEqual({
      'Full Name': { value: 'Jane Doe', description: "employee's legal name" },
      Age: { value: '42' },
      agree_handbook: { value: 'true' },
      'Middle Name': { value: '' },
    });
  });

  it('accepts the plain {field: value} JSON shape as an object or a JSON string', () => {
    const expected = { full_name: { value: 'Jane Doe' }, start_date: { value: '2026-01-15' }, headcount: { value: '3' }, agree_handbook: { value: 'yes' } };
    const object = { full_name: 'Jane Doe', start_date: '2026-01-15', headcount: 3, agree_handbook: 'yes' };
    expect(fillOperation.toFieldData(fillOperation.fieldsFromJson(object))).toEqual(expected);
    expect(fillOperation.toFieldData(fillOperation.fieldsFromJson(JSON.stringify(object)))).toEqual(expected);
  });

  it('accepts the {field: {value, description}} JSON shape and mixes with plain values', () => {
    const fields = fillOperation.fieldsFromJson({
      full_name: { value: 'Jane Doe', description: 'Employee full legal name' },
      email: { value: 'jane@example.com' },
      agree_handbook: { value: false, description: 'tick box' },
      job_title: 'Engineer',
    });
    expect(fillOperation.toFieldData(fields)).toEqual({
      full_name: { value: 'Jane Doe', description: 'Employee full legal name' },
      email: { value: 'jane@example.com' },
      agree_handbook: { value: 'false', description: 'tick box' },
      job_title: { value: 'Engineer' },
    });
  });

  it('rejects JSON that is not an object of fields', () => {
    expect(() => fillOperation.fieldsFromJson('[1, 2]')).toThrow(/must be a JSON object/);
    expect(() => fillOperation.fieldsFromJson('not json')).toThrow(/must be a JSON object/);
    expect(() => fillOperation.fieldsFromJson(undefined)).toThrow(/must be a JSON object/);
    expect(() => fillOperation.fieldsFromJson({ full_name: { description: 'no value' } })).toThrow(/"full_name" must be a text value or an object with "value"/);
    expect(() => fillOperation.fieldsFromJson({ address: { value: { street: 'Main' } } })).toThrow(/field "address" must be text, a number or true\/false/);
    expect(() => fillOperation.fieldsFromJson({ tags: ['a', 'b'] })).toThrow(/field "tags" must be text/);
  });
});

describe('field values that arrive as a JSON string', () => {
  it('reads the list from the string, as the dynamic-value toggle sends it', () => {
    const fields = fillOperation.fieldsFromList('[{"name":"Full Name","value":"Jane"},{"name":"Agree","value":true}]');
    expect(fillOperation.toFieldData(fields)).toEqual({ 'Full Name': { value: 'Jane' }, Agree: { value: 'true' } });
  });
});

describe('checks before sending', () => {
  it('stops when there are no field values', () => {
    expect(() => fillOperation.toFieldData(fillOperation.fieldsFromList([]))).toThrow(/at least one field value/);
    expect(() => fillOperation.toFieldData(fillOperation.fieldsFromList(undefined))).toThrow(/at least one field value/);
    expect(() => fillOperation.toFieldData(fillOperation.fieldsFromJson({}))).toThrow(/at least one field value/);
  });

  it('stops on an empty field name', () => {
    expect(() => fillOperation.toFieldData(fillOperation.fieldsFromList([{ name: 'Full Name', value: 'Jane' }, { name: '  ', value: 'x' }]))).toThrow(/Field value 2 has no field name/);
    expect(() => fillOperation.toFieldData(fillOperation.fieldsFromJson({ '': 'x' }))).toThrow(/has no field name/);
  });

  it('stops on a duplicate field name', () => {
    expect(() => fillOperation.toFieldData(fillOperation.fieldsFromList([{ name: 'Full Name', value: 'Jane' }, { name: 'Full Name ', value: 'John' }]))).toThrow(/"Full Name" is given more than once/);
  });

  it('accepts a threshold from 0 to 1 and stops outside it', () => {
    expect(fillOperation.readThreshold(undefined)).toBeUndefined();
    expect(fillOperation.readThreshold(null)).toBeUndefined();
    expect(fillOperation.readThreshold(0)).toBe(0);
    expect(fillOperation.readThreshold(1)).toBe(1);
    expect(fillOperation.readThreshold('0.7')).toBe(0.7);
    expect(() => fillOperation.readThreshold(7)).toThrow(/from 0 to 1/);
    expect(() => fillOperation.readThreshold(-0.1)).toThrow(/from 0 to 1/);
    expect(() => fillOperation.readThreshold('high')).toThrow(/from 0 to 1/);
  });

  it('never calls Datalab when a check fails', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const audience: DatalabAudience = 'ai';
    const base = {
      apiKey: 'k',
      audience,
      source: datalabSource.fromAi({ fileUrl: 'https://example.com/form.pdf', noun: 'form' }),
      context: undefined,
      pageRange: undefined,
      outputFileName: undefined,
      skipCache: false,
      files: fakeFiles(),
      timing: fakeTiming(),
    };
    await expect(fillOperation.run({ ...base, fields: [{ name: 'full_name', value: 'Jane' }], confidenceThreshold: 7 })).rejects.toThrow(/from 0 to 1/);
    await expect(fillOperation.run({ ...base, fields: [], confidenceThreshold: undefined })).rejects.toThrow(/at least one field value/);
    await expect(fillOperation.run({ ...base, fields: [{ name: 'full_name', value: 'Jane' }], confidenceThreshold: undefined, pageRange: 'first page' })).rejects.toThrow(/Page Range/);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('run', () => {
  it('sends a human run with an uploaded file as multipart and returns the saved file', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(processing).mockResolvedValueOnce(ok(acroResult));
    const files = fakeFiles();
    const source = datalabSource.fromHuman({
      source: 'file',
      file: { filename: 'employee-form.pdf', extension: 'pdf', data: Buffer.from('%PDF-1.7 blank form') },
      fileUrl: undefined,
      noun: 'form',
    });
    const output = await fillOperation.run({
      apiKey: 'key_1',
      audience: 'human',
      source,
      fields: fillOperation.fieldsFromList([
        { name: 'full_name', value: 'Jane Doe', description: 'legal name' },
        { name: 'agree_handbook', value: 'yes' },
      ]),
      context: '  New employee form  ',
      confidenceThreshold: 0.7,
      pageRange: '0',
      outputFileName: 'jane-doe',
      skipCache: true,
      files,
      timing: fakeTiming(),
    });

    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://www.datalab.to/api/v1/fill');
    expect(request.headers).toEqual({ 'X-API-Key': 'key_1' });
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/fill/req_fill');
    const form = formOf(spy.mock.calls[0][0].body);
    const file = form.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect(file instanceof File ? file.name : undefined).toBe('employee-form.pdf');
    expect(form.get('file_url')).toBeNull();
    expect(JSON.parse(String(form.get('field_data')))).toEqual({ full_name: { value: 'Jane Doe', description: 'legal name' }, agree_handbook: { value: 'yes' } });
    expect(form.get('context')).toBe('New employee form');
    expect(form.get('confidence_threshold')).toBe('0.7');
    expect(form.get('page_range')).toBe('0');
    expect(form.get('skip_cache')).toBe('true');
    expect(form.get('max_pages')).toBeNull();

    expect(output).toEqual({
      completed: true,
      status: 'complete',
      request_id: 'req_fill',
      file: 'https://cloud.activepieces.com/api/v1/files/jane-doe.pdf',
      file_name: 'jane-doe.pdf',
      size: pdfBytes.length,
      output_format: 'pdf',
      fields_filled: ['agree_handbook', 'email', 'full_name', 'start_date'],
      fields_not_found: ['favourite_colour'],
      fields_filled_count: 4,
      page_count: 1,
    });
    expect(files.write).toHaveBeenCalledTimes(1);
  });

  it('sends an AI run with a URL source and leaves out empty options', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce(ok(flatPngResult));
    const output = await fillOperation.run({
      apiKey: 'k',
      audience: 'ai',
      source: datalabSource.fromAi({ fileUrl: ' https://example.com/forms/flat.png ', noun: 'form' }),
      fields: fillOperation.fieldsFromJson('{"Full Name": "Jane Doe", "Email Address": {"value": "jane@example.com"}}'),
      context: '',
      confidenceThreshold: undefined,
      pageRange: undefined,
      outputFileName: undefined,
      skipCache: false,
      files: fakeFiles(),
      timing: fakeTiming(),
    });
    const form = formOf(spy.mock.calls[0][0].body);
    expect(form.get('file_url')).toBe('https://example.com/forms/flat.png');
    expect(form.get('file')).toBeNull();
    expect(JSON.parse(String(form.get('field_data')))).toEqual({ 'Full Name': { value: 'Jane Doe' }, 'Email Address': { value: 'jane@example.com' } });
    expect(form.get('context')).toBeNull();
    expect(form.get('confidence_threshold')).toBeNull();
    expect(form.get('page_range')).toBeNull();
    expect(form.get('skip_cache')).toBe('false');
    expect(output).toMatchObject({ completed: true, file_name: 'filled-form.png', output_format: 'png', fields_filled_count: 3, fields_not_found: [] });
  });

  it('fails a human run that outlasts the wait, naming the request ID for Get Result', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    const files = fakeFiles();
    await expect(
      fillOperation.run({
        apiKey: 'k',
        audience: 'human',
        source: datalabSource.fromAi({ fileUrl: 'https://example.com/form.pdf', noun: 'form' }),
        fields: [{ name: 'full_name', value: 'Jane' }],
        context: undefined,
        confidenceThreshold: undefined,
        pageRange: undefined,
        outputFileName: undefined,
        skipCache: false,
        files,
        timing: fakeTiming(),
      }),
    ).rejects.toThrow(/still processing request req_fill.*Get Result.*"Fill Form"/);
    expect(files.write).not.toHaveBeenCalled();
  });

  it('returns completed=false to an agent when the wait runs out', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    const output = await fillOperation.run({
      apiKey: 'k',
      audience: 'ai',
      source: datalabSource.fromAi({ fileUrl: 'https://example.com/form.pdf', noun: 'form' }),
      fields: [{ name: 'full_name', value: 'Jane' }],
      context: undefined,
      confidenceThreshold: undefined,
      pageRange: undefined,
      outputFileName: undefined,
      skipCache: false,
      files: fakeFiles(),
      timing: fakeTiming(),
    });
    expect(output).toMatchObject({ completed: false, status: 'processing', request_id: 'req_fill' });
    expect(output).toHaveProperty('message', expect.stringMatching(/Get Result/));
  });
});

describe('shape', () => {
  it('saves the decoded PDF once under the given name and returns no base64', async () => {
    const files = fakeFiles();
    const output = await fillOperation.shape({ result: acroResult, files, options: { fileName: 'w4 jane.pdf' } });
    expect(files.write).toHaveBeenCalledTimes(1);
    const written = files.write.mock.calls[0][0];
    expect(written.fileName).toBe('w4 jane.pdf');
    expect(Buffer.isBuffer(written.data) && written.data.equals(pdfBytes)).toBe(true);
    expect(output.file_name).toBe('w4 jane.pdf');
    expect(output.size).toBe(pdfBytes.length);
    expect(output).not.toHaveProperty('output_base64');
    expect(JSON.stringify(output)).not.toContain(acroResult.output_base64);
  });

  it('saves a PNG under the default name when no options are given', async () => {
    const files = fakeFiles();
    const output = await fillOperation.shape({ result: flatPngResult, files });
    expect(files.write).toHaveBeenCalledTimes(1);
    const written = files.write.mock.calls[0][0];
    expect(written.fileName).toBe('filled-form.png');
    expect(Buffer.isBuffer(written.data) && written.data.equals(pngBytes)).toBe(true);
    expect(output).toEqual({
      file: 'https://cloud.activepieces.com/api/v1/files/filled-form.png',
      file_name: 'filled-form.png',
      size: pngBytes.length,
      output_format: 'png',
      fields_filled: ['Email Address', 'Full Name', 'Job Title'],
      fields_not_found: [],
      fields_filled_count: 3,
      page_count: 1,
    });
    expect(JSON.stringify(output)).not.toContain(flatPngResult.output_base64);
  });

  it('swaps a wrong extension in the given name for the one Datalab returned', async () => {
    const files = fakeFiles();
    const output = await fillOperation.shape({ result: flatPngResult, files, options: { fileName: 'scan.pdf' } });
    expect(output.file_name).toBe('scan.png');
  });

  it('fails clearly when the result has no filled form', async () => {
    const files = fakeFiles();
    await expect(fillOperation.shape({ result: { status: 'complete', success: true, pages: [] }, files })).rejects.toThrow(/sent no filled form/);
    expect(files.write).not.toHaveBeenCalled();
  });
});

describe('hasOutput', () => {
  it('is true only when output_base64 is a non-empty string', () => {
    expect(fillOperation.hasOutput(acroResult)).toBe(true);
    expect(fillOperation.hasOutput(flatPngResult)).toBe(true);
    expect(fillOperation.hasOutput({ status: 'complete', success: true, output_base64: '' })).toBe(false);
    expect(fillOperation.hasOutput({ status: 'complete', success: true, output_base64: null })).toBe(false);
    expect(fillOperation.hasOutput({ status: 'complete', success: true, pages: [] })).toBe(false);
  });
});
