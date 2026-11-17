import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDocumentAction } from '../src/lib/actions/create-document';
import { DatalabTiming } from '../src/lib/common/client';
import { createDocumentOperation } from '../src/lib/operations/create-document';

const DOCX_BYTES = Buffer.from('PK\u0003\u0004 fake docx bytes');
const DOCX_BASE64 = DOCX_BYTES.toString('base64');

const docxResult = {
  progress_percent: 100,
  status: 'complete',
  result_url: null,
  expires_in: null,
  success: true,
  error: null,
  output_format: 'docx',
  output_base64: DOCX_BASE64,
  runtime: 0.07185101509094238,
  page_count: 1,
  cost_breakdown: { final_cost_cents: 0.6 },
  versions: null,
};

const fillResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'pdf',
  output_base64: 'JVBERi0xLjQK',
  fields_filled: ['name'],
  fields_not_found: [],
  page_count: 1,
};

const convertResult = {
  status: 'complete',
  success: true,
  error: '',
  output_format: 'markdown',
  markdown: '# Invoice',
  page_count: 1,
};

const submitted = {
  status: 200,
  body: {
    success: true,
    error: null,
    request_id: 'E3oAWw23yxUAVpU9AuQQMA',
    request_check_url: 'https://www.datalab.to/api/v1/create-document/E3oAWw23yxUAVpU9AuQQMA',
    versions: null,
    checkpoint_reused: null,
  },
};

const processing = { status: 200, body: { status: 'processing', progress_percent: 5, success: null, error: null, result_url: null } };

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
  const write = vi.fn<FilesService['write']>(async ({ fileName }) => `https://cloud.activepieces.com/api/v1/files/${fileName}`);
  const upload = vi.fn<FilesService['upload']>(async () => ({ id: 'f1', url: 'https://cloud.activepieces.com/api/v1/files/f1' }));
  const files: FilesService = { write, upload };
  return { files, write };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createDocumentOperation.run', () => {
  it('posts a JSON body to /create-document, polls the same operation and returns the saved file', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValueOnce({ status: 200, body: docxResult });
    const { files, write } = fakeFiles();
    const output = await createDocumentOperation.run({ apiKey: 'key_1', files, markdown: '# Contract', fileName: 'contract', timing: fakeTiming() });
    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://www.datalab.to/api/v1/create-document');
    expect(request.headers).toEqual({ 'X-API-Key': 'key_1' });
    expect(request.body).toEqual({ markdown: '# Contract', output_format: 'docx' });
    expect(request.body).not.toBeInstanceOf(FormData);
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/create-document/E3oAWw23yxUAVpU9AuQQMA');
    expect(write).toHaveBeenCalledTimes(1);
    expect(output).toEqual({
      completed: true,
      status: 'complete',
      request_id: 'E3oAWw23yxUAVpU9AuQQMA',
      file: 'https://cloud.activepieces.com/api/v1/files/contract.docx',
      file_name: 'contract.docx',
      size: DOCX_BYTES.length,
      page_count: 1,
      output_format: 'docx',
    });
  });

  it('stops before sending when the Markdown is empty', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const { files, write } = fakeFiles();
    for (const markdown of ['', '   \n ', undefined, null]) {
      await expect(createDocumentOperation.run({ apiKey: 'k', files, markdown, fileName: undefined, timing: fakeTiming() })).rejects.toThrow('The Markdown field is empty');
    }
    expect(spy).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('passes a Datalab 422 through as a readable error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new HttpError(undefined, { status: 422, responseBody: { detail: [{ type: 'missing', loc: ['body', 'markdown'], msg: 'Field required', input: {} }] } }),
    );
    const { files } = fakeFiles();
    await expect(createDocumentOperation.run({ apiKey: 'k', files, markdown: '# Hi', fileName: undefined, timing: fakeTiming() })).rejects.toThrow('HTTP 422): markdown: Field required');
  });

  it('returns completed false with the request id instead of throwing when the wait runs out', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(submitted).mockResolvedValue(processing);
    const { files, write } = fakeFiles();
    const output = await createDocumentOperation.run({ apiKey: 'k', files, markdown: '# Hi', fileName: undefined, timing: fakeTiming() });
    expect(output).toMatchObject({ completed: false, status: 'processing', request_id: 'E3oAWw23yxUAVpU9AuQQMA' });
    expect(output).toHaveProperty('message', expect.stringMatching(/^Timed out, not failed: .*after 4 minutes.*Get Result with operation "Create Document"/));
    expect(write).not.toHaveBeenCalled();
  });
});

describe('createDocumentOperation.shape', () => {
  const cases: Array<{ name: string; options?: { fileName?: unknown }; expected: string }> = [
    { name: 'the default name', options: { fileName: undefined }, expected: 'document.docx' },
    { name: 'an empty name', options: { fileName: '  ' }, expected: 'document.docx' },
    { name: 'a custom name', options: { fileName: 'Q3 report' }, expected: 'Q3 report.docx' },
    { name: 'a name already ending in .docx', options: { fileName: 'offer.DOCX' }, expected: 'offer.DOCX' },
    { name: 'no options, as Get Result calls it', options: undefined, expected: 'document.docx' },
  ];
  for (const entry of cases) {
    it(`saves the decoded bytes once under ${entry.name}`, async () => {
      const { files, write } = fakeFiles();
      const output = await createDocumentOperation.shape({ result: docxResult, files, options: entry.options });
      expect(write).toHaveBeenCalledTimes(1);
      const saved = write.mock.calls[0][0];
      expect(saved.fileName).toBe(entry.expected);
      expect(Buffer.isBuffer(saved.data) && saved.data.equals(DOCX_BYTES)).toBe(true);
      expect(output.file_name).toBe(entry.expected);
    });
  }

  it('works without options and returns no base64', async () => {
    const { files } = fakeFiles();
    const output = await createDocumentOperation.shape({ result: docxResult, files });
    expect(Object.keys(output).sort()).toEqual(['file', 'file_name', 'output_format', 'page_count', 'size']);
    expect(JSON.stringify(output)).not.toContain(DOCX_BASE64);
    expect(output).not.toHaveProperty('completed');
    expect(output).not.toHaveProperty('request_id');
  });

  it('fails clearly when the result has no Word file', async () => {
    const { files, write } = fakeFiles();
    await expect(createDocumentOperation.shape({ result: convertResult, files })).rejects.toThrow('sent no Word file');
    expect(write).not.toHaveBeenCalled();
  });
});

describe('createDocumentOperation.hasOutput', () => {
  it('is true for a create-document result', () => {
    expect(createDocumentOperation.hasOutput(docxResult)).toBe(true);
  });

  it('is false for a fill result, a convert result and an empty result', () => {
    expect(createDocumentOperation.hasOutput(fillResult)).toBe(false);
    expect(createDocumentOperation.hasOutput(convertResult)).toBe(false);
    expect(createDocumentOperation.hasOutput({ status: 'complete', success: true, output_base64: '', output_format: 'docx' })).toBe(false);
    expect(createDocumentOperation.hasOutput({ status: 'complete', success: true, output_base64: null, output_format: null })).toBe(false);
  });
});

describe('createDocumentAction', () => {
  it('is one READ action for flows and agents with the expected props and schema', () => {
    expect(createDocumentAction.name).toBe('create_document');
    expect(createDocumentAction.displayName).toBe('Create Document');
    expect(createDocumentAction.audience).toBe('both');
    expect(createDocumentAction.classification).toBe('READ');
    expect(createDocumentAction.aiMetadata?.idempotent).toBe(true);
    expect(Object.keys(createDocumentAction.props)).toEqual(['markdown', 'file_name']);
    expect(createDocumentAction.props.markdown.required).toBe(true);
    expect(createDocumentAction.props.file_name.required).toBe(false);
    const keys = createDocumentOperation.outputSchema.fields.map((field) => field.key);
    expect(keys).toEqual(['completed', 'status', 'request_id', 'message', 'file', 'file_name', 'size', 'page_count', 'output_format']);
  });
});
