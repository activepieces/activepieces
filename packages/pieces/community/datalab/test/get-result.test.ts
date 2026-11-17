import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getResultAction } from '../src/lib/actions/get-result';
import { datalabClient, DatalabOperation } from '../src/lib/common/client';
import { datalabProps } from '../src/lib/common/props';
import { convertOperation } from '../src/lib/operations/convert';
import { createDocumentOperation } from '../src/lib/operations/create-document';
import { extractOperation } from '../src/lib/operations/extract';
import { fillOperation } from '../src/lib/operations/fill';
import { formFieldsOperation } from '../src/lib/operations/form-fields';
import { getResultOperation } from '../src/lib/operations/get-result';
import { segmentOperation } from '../src/lib/operations/segment';

const REQUEST_ID = 'req_1';
const PDF_BASE64 = Buffer.from('%PDF-1.4 filled').toString('base64');
const DOCX_BASE64 = Buffer.from('PK\u0003\u0004 docx').toString('base64');
const IMAGE_BASE64 = Buffer.from('fake jpeg').toString('base64');

const ALL_OPERATIONS: DatalabOperation[] = ['convert', 'extract', 'segment', 'fill', 'form-fields', 'create-document'];

const processing = { status: 'processing', progress_percent: 5, success: null, error: null, result_url: null, output_base64: null };

const convertResult = {
  status: 'complete',
  success: true,
  error: '',
  output_format: 'markdown',
  markdown: '# Invoice\n\n![](img_1.jpeg)',
  html: null,
  json: null,
  chunks: null,
  extraction_schema_json: null,
  segmentation_results: null,
  images: { 'img_1.jpeg': IMAGE_BASE64 },
  metadata: { failed_pages: [] },
  parse_quality_score: 4.5,
  page_count: 2,
};

const extractResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'markdown',
  markdown: '# Invoice',
  json: { children: [] },
  html: null,
  chunks: null,
  extraction_schema_json: '{"invoice_number": "INV-1", "invoice_number_citations": ["/page/0/Text/1"]}',
  extraction_mode: 'balanced',
  extraction_score_average: null,
  segmentation_results: null,
  page_count: 1,
};

const segmentResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'json',
  markdown: null,
  json: null,
  extraction_schema_json: null,
  segmentation_results: {
    segments: [{ name: 'Invoice', pages: [0, 1], confidence: 'high', segment_type: 'document' }],
    metadata: { total_pages: 2, segmentation_method: 'document_boundary', missing_segments: [], unassigned_pages: [] },
  },
  page_count: 2,
};

const fillResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'pdf',
  output_base64: PDF_BASE64,
  fields_filled: ['Full Name'],
  fields_not_found: ['Nickname'],
  page_count: 1,
};

const formFieldsResult = {
  status: 'complete',
  success: true,
  error: '',
  pages: [{ page: 0, fields: [{ label: 'Full Name:', name: '', field_type: 'text', bbox: [1, 2, 3, 4] }] }],
  json: { children: [] },
  page_count: 1,
};

const createDocumentResult = {
  status: 'complete',
  success: true,
  error: null,
  output_format: 'docx',
  output_base64: DOCX_BASE64,
  page_count: 1,
};

const convertUnderExtract = { ...convertResult, extraction_schema_json: null, extraction_mode: null };

const convertUnderFill = {
  status: 'complete',
  success: true,
  error: '',
  output_format: null,
  output_base64: null,
  fields_filled: null,
  fields_not_found: null,
  page_count: 2,
};

function fakeFiles() {
  const write = vi.fn<FilesService['write']>(async ({ fileName }) => `https://cloud.activepieces.com/api/v1/files/${fileName}`);
  const upload = vi.fn<FilesService['upload']>(async () => ({ id: 'f1', url: 'https://cloud.activepieces.com/api/v1/files/f1' }));
  const files: FilesService = { write, upload };
  return { files, write };
}

function respond(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function reject(error: Error) {
  return vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(error);
}

function getResult({ operation, requestId = REQUEST_ID, files = fakeFiles().files }: { operation: unknown; requestId?: unknown; files?: FilesService }) {
  return getResultOperation.run({ apiKey: 'key_1', operation, requestId, files });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getResultOperation.run polling', () => {
  for (const operation of ALL_OPERATIONS) {
    it(`polls /${operation}/<id> once with the key and does not wait`, async () => {
      const spy = respond(processing);
      await getResult({ operation, requestId: `  ${REQUEST_ID} ` });
      expect(spy).toHaveBeenCalledTimes(1);
      const request = spy.mock.calls[0][0];
      expect(request.method).toBe(HttpMethod.GET);
      expect(request.url).toBe(`https://www.datalab.to/api/v1/${operation}/${REQUEST_ID}`);
      expect(request.headers).toEqual({ 'X-API-Key': 'key_1' });
    });
  }

  it('returns completed false with a next-step message while Datalab is still working', async () => {
    respond({ progress_percent: 5, status: 'processing', result_url: null, success: null, error: null, output_format: null, output_base64: null, fields_filled: null });
    const { files, write } = fakeFiles();
    const output = await getResult({ operation: 'fill', files });
    expect(output).toEqual({
      completed: false,
      status: 'processing',
      request_id: REQUEST_ID,
      message: expect.stringContaining('Datalab is still working on request req_1'),
    });
    expect(output).toHaveProperty('message', expect.stringContaining('Run Get Result again in a little while with Operation "Fill Form"'));
    expect(write).not.toHaveBeenCalled();
  });
});

describe('getResultOperation.run shaping', () => {
  it('returns a Convert result with its images saved', async () => {
    respond(convertResult);
    const { files, write } = fakeFiles();
    const output = await getResult({ operation: 'convert', files });
    expect(output).toMatchObject({
      completed: true,
      status: 'complete',
      request_id: REQUEST_ID,
      output_format: 'markdown',
      content: '# Invoice\n\n![](img_1.jpeg)',
      page_count: 2,
      parse_quality_score: 4.5,
      images: [{ file: 'https://cloud.activepieces.com/api/v1/files/img_1.jpeg', file_name: 'img_1.jpeg' }],
      file: null,
    });
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('returns an Extract result split into data and citations, without the parsed document', async () => {
    respond(extractResult);
    const output = await getResult({ operation: 'extract' });
    expect(output).toMatchObject({
      completed: true,
      status: 'complete',
      request_id: REQUEST_ID,
      data: { invoice_number: 'INV-1' },
      citations: { invoice_number: ['/page/0/Text/1'] },
      extraction_mode: 'balanced',
      page_count: 1,
    });
    expect(output).not.toHaveProperty('markdown');
  });

  it('returns a Segment result', async () => {
    respond(segmentResult);
    const output = await getResult({ operation: 'segment' });
    expect(output).toMatchObject({
      completed: true,
      request_id: REQUEST_ID,
      segment_count: 1,
      segments: [{ name: 'Invoice', pages: [0, 1], first_page: 0, last_page: 1 }],
      total_pages: 2,
      method: 'document_boundary',
    });
  });

  it('returns a Fill result with the filled form saved', async () => {
    respond(fillResult);
    const { files, write } = fakeFiles();
    const output = await getResult({ operation: 'fill', files });
    expect(output).toMatchObject({
      completed: true,
      request_id: REQUEST_ID,
      file: 'https://cloud.activepieces.com/api/v1/files/filled-form.pdf',
      file_name: 'filled-form.pdf',
      output_format: 'pdf',
      fields_filled: ['Full Name'],
      fields_not_found: ['Nickname'],
      fields_filled_count: 1,
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(output)).not.toContain(PDF_BASE64);
  });

  it('returns a Get Form Fields result', async () => {
    respond(formFieldsResult);
    const output = await getResult({ operation: 'form-fields' });
    expect(output).toMatchObject({
      completed: true,
      request_id: REQUEST_ID,
      field_count: 1,
      fields: [{ page: 0, label: 'Full Name:', field_type: 'text', left: 1, top: 2, right: 3, bottom: 4 }],
      page_count: 1,
    });
  });

  it('returns a Create Document result with the Word file saved', async () => {
    respond(createDocumentResult);
    const { files, write } = fakeFiles();
    const output = await getResult({ operation: 'create-document', files });
    expect(output).toMatchObject({
      completed: true,
      request_id: REQUEST_ID,
      file: 'https://cloud.activepieces.com/api/v1/files/document.docx',
      file_name: 'document.docx',
      output_format: 'docx',
      page_count: 1,
    });
    expect(write).toHaveBeenCalledTimes(1);
  });
});

describe('getResultOperation.run wrong operation', () => {
  const cases: Array<{ name: string; operation: DatalabOperation; body: Record<string, unknown>; message: RegExp }> = [
    {
      name: 'a Convert result under Fill Form',
      operation: 'fill',
      body: convertUnderFill,
      message: /^Request req_1 was not made by Fill Form: it finished without a Fill Form result\. Pick the action that created it in Operation\.$/,
    },
    {
      name: 'a Fill result under Convert Document',
      operation: 'convert',
      body: fillResult,
      message: /^Request req_1 was not made by Convert Document\. Pick the action that created it in Operation: it looks like Fill Form\.$/,
    },
    {
      name: 'an Extract result under Convert Document',
      operation: 'convert',
      body: extractResult,
      message: /was not made by Convert Document\..*it looks like Extract Structured Data/,
    },
    {
      name: 'a Segment result under Convert Document',
      operation: 'convert',
      body: segmentResult,
      message: /was not made by Convert Document\..*it looks like Segment Document/,
    },
    {
      name: 'a Convert result under Extract Structured Data',
      operation: 'extract',
      body: convertUnderExtract,
      message: /was not made by Extract Structured Data\..*it looks like Convert Document/,
    },
    {
      name: 'a Fill result under Create Document',
      operation: 'create-document',
      body: fillResult,
      message: /was not made by Create Document\..*it looks like Fill Form/,
    },
    {
      name: 'a Create Document result under Fill Form',
      operation: 'fill',
      body: createDocumentResult,
      message: /was not made by Fill Form\..*it looks like Create Document/,
    },
    {
      name: 'a Get Form Fields result under Convert Document',
      operation: 'convert',
      body: formFieldsResult,
      message: /was not made by Convert Document\..*it looks like Get Form Fields/,
    },
  ];
  for (const entry of cases) {
    it(`stops on ${entry.name} before saving anything`, async () => {
      respond(entry.body);
      const { files, write } = fakeFiles();
      await expect(getResult({ operation: entry.operation, files })).rejects.toThrow(entry.message);
      expect(write).not.toHaveBeenCalled();
    });
  }

  it('detects every operation from its own result', () => {
    const results: Record<DatalabOperation, Record<string, unknown>> = {
      convert: convertResult,
      extract: extractResult,
      segment: segmentResult,
      fill: fillResult,
      'form-fields': formFieldsResult,
      'create-document': createDocumentResult,
    };
    for (const operation of ALL_OPERATIONS) {
      expect(getResultOperation.detectOperation(results[operation]), operation).toBe(operation);
    }
    expect(getResultOperation.detectOperation(convertUnderFill)).toBeUndefined();
    expect([...getResultOperation.DETECTION_ORDER].sort()).toEqual([...ALL_OPERATIONS].sort());
  });
});

describe('getResultOperation.run inputs', () => {
  const accepted: Array<{ value: string; operation: DatalabOperation }> = [
    { value: 'Fill Form', operation: 'fill' },
    { value: 'fill form', operation: 'fill' },
    { value: 'FILL', operation: 'fill' },
    { value: ' Convert Document ', operation: 'convert' },
    { value: 'Get Form Fields', operation: 'form-fields' },
    { value: 'FORM_FIELDS', operation: 'form-fields' },
    { value: 'create document', operation: 'create-document' },
    { value: 'Extract Structured Data', operation: 'extract' },
    { value: 'Segment', operation: 'segment' },
  ];
  for (const entry of accepted) {
    it(`accepts "${entry.value}" as ${entry.operation}`, async () => {
      const spy = respond(processing);
      await getResult({ operation: entry.value });
      expect(spy.mock.calls[0][0].url).toBe(`https://www.datalab.to/api/v1/${entry.operation}/${REQUEST_ID}`);
    });
  }

  it('rejects an unknown operation and lists the valid ones, without calling Datalab', async () => {
    const spy = respond(processing);
    for (const operation of ['ocr', 'Get Results', 'form']) {
      await expect(getResult({ operation })).rejects.toThrow(
        `Operation "${operation}" is not valid. Pick the action that created the request, one of: convert (Convert Document), extract (Extract Structured Data), segment (Segment Document), fill (Fill Form), form-fields (Get Form Fields), create-document (Create Document).`,
      );
    }
    for (const operation of [undefined, null, '', '  ', 3]) {
      await expect(getResult({ operation })).rejects.toThrow('Operation is empty. Pick the action that created the request, one of: convert (Convert Document)');
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects an empty request ID without calling Datalab', async () => {
    const spy = respond(processing);
    for (const requestId of ['', '   ', undefined, null, {}]) {
      await expect(getResultOperation.run({ apiKey: 'key_1', operation: 'convert', requestId, files: fakeFiles().files })).rejects.toThrow(
        'Give the Request ID that the Datalab action returned.',
      );
    }
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('getResultOperation.run errors', () => {
  it('surfaces a failed job with Datalab reason', async () => {
    respond({ status: 'complete', success: false, error: 'The file is not a valid PDF.', markdown: null, page_count: null });
    await expect(getResult({ operation: 'convert' })).rejects.toThrow('Datalab could not process the document (request req_1): The file is not a valid PDF.');
  });

  it('surfaces a 404 as an unknown or expired request', async () => {
    reject(new HttpError(undefined, { status: 404, responseBody: { detail: 'Request not found.' } }));
    await expect(getResult({ operation: 'convert' })).rejects.toThrow('Datalab could not find request req_1. Check the Request ID. Results are deleted about one day after they finish.');
  });

  it('surfaces a 402 on the poll as a spend limit', async () => {
    reject(new HttpError(undefined, { status: 402, responseBody: { detail: 'API key is at or over the configured 30-day billing limit.' } }));
    await expect(getResult({ operation: 'fill' })).rejects.toThrow('spend limit is used up');
  });
});

describe('getResultAction', () => {
  it('is one READ action for flows and agents with two required props', () => {
    expect(getResultAction.name).toBe('get_result');
    expect(getResultAction.displayName).toBe('Get Result');
    expect(getResultAction.audience).toBe('both');
    expect(getResultAction.classification).toBe('READ');
    expect(getResultAction.aiMetadata?.idempotent).toBe(true);
    expect(getResultAction.aiMetadata?.description).toMatch(/does not spend Datalab credits/);
    expect(Object.keys(getResultAction.props)).toEqual(['operation', 'request_id']);
    expect(getResultAction.props.operation.required).toBe(true);
    expect(getResultAction.props.request_id.required).toBe(true);
    expect(getResultAction.props.operation.options.options).toEqual(
      ALL_OPERATIONS.map((operation) => ({ value: operation, label: datalabClient.OPERATION_LABELS[operation] })),
    );
  });

  it('has one output schema that starts with the envelope and holds every operation field once', () => {
    const keys = getResultOperation.outputSchema.fields.map((field) => field.key);
    const envelope = datalabProps.envelopeFields().map((field) => field.key);
    expect(getResultAction.outputSchema).toBe(getResultOperation.outputSchema);
    expect(keys.slice(0, envelope.length)).toEqual(envelope);
    expect(new Set(keys).size).toBe(keys.length);
    const schemas = [convertOperation, extractOperation, segmentOperation, fillOperation, formFieldsOperation, createDocumentOperation].map((operation) => operation.outputSchema);
    for (const schema of schemas) {
      for (const field of schema.fields) {
        expect(keys, field.key).toContain(field.key);
      }
    }
    const file = getResultOperation.outputSchema.fields.find((field) => field.key === 'file');
    expect(file?.format).toBe('url');
    expect(file?.description).toMatch(/Fill Form and Create Document/);
    expect(file?.description).not.toMatch(/Also Save as File/);
    expect(getResultOperation.outputSchema.fields.find((field) => field.key === 'output_format')?.description).toMatch(/docx/);
  });
});
