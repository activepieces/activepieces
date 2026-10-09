import { beforeEach, describe, expect, it, vi } from 'vitest';

const process = vi.hoisted(() => vi.fn<() => Promise<unknown>>());
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleDocumentAiApi: { ...actual.GoogleDocumentAiApi, process } };
});
vi.mock('../../../src/lib/common/token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/token')>();
  return { ...actual, resolveAuth };
});

const { processDocument } = await import('../../../src/lib/actions/process-document');
const { DEFAULT_FIELD_MASK } = await import('../../../src/lib/common/document');

const AUTH = { accessToken: 't', projectId: 'my-project', location: 'us' };
const PROCESSOR = 'projects/my-project/locations/us/processors/abc';
const ctx = (propsValue: Record<string, unknown>) => ({ auth: { type: 'CUSTOM_AUTH', props: {} }, propsValue }) as never;
const file = { filename: 'invoice.pdf', extension: 'pdf', base64: 'JVBERi0=' };

beforeEach(() => {
  process.mockReset();
  resolveAuth.mockReset();
  resolveAuth.mockResolvedValue(AUTH);
  process.mockResolvedValue({ document: { text: 'Hello', mimeType: 'application/pdf', pages: [{ pageNumber: 1 }] } });
});

describe('processDocument', () => {
  it('should send a raw document with inferred MIME type, default field mask and imageless mode, and flatten the result', async () => {
    const output = await processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file }));

    expect(process).toHaveBeenCalledWith({ auth: AUTH, processorName: PROCESSOR, request: {
      rawDocument: { content: 'JVBERi0=', mimeType: 'application/pdf', displayName: 'invoice.pdf' },
      imagelessMode: true,
      fieldMask: DEFAULT_FIELD_MASK,
    } });
    expect(output).toEqual({ processor: PROCESSOR, text: 'Hello', mimeType: 'application/pdf', pageCount: 1, languages: [], entities: [], formFields: [], tables: [] });
  });

  it('should accept a bare processor id with a version, page selection, explicit MIME type and the full document', async () => {
    process.mockResolvedValue({ document: { text: 'x', pages: [] }, humanReviewStatus: { state: 'SKIPPED' } });

    const output = await processDocument.run(
      ctx({ processor: 'abc', processorVersion: 'pretrained-ocr-v2.0-2023-06-02', source: 'file', file: { ...file, filename: 'scan' }, mimeType: 'image/png', pages: '1,3-4', imagelessMode: false, includeFullDocument: true, fieldMask: 'pages.formFields' })
    );

    expect(process).toHaveBeenCalledWith({ auth: AUTH, processorName: `${PROCESSOR}/processorVersions/pretrained-ocr-v2.0-2023-06-02`, request: {
      rawDocument: { content: 'JVBERi0=', mimeType: 'image/png', displayName: 'scan' },
      processOptions: { individualPageSelector: { pages: [1, 3, 4] } },
    } });
    expect(output).toMatchObject({ document: { text: 'x', pages: [] }, humanReviewStatus: { state: 'SKIPPED' } });
  });

  it('should add text to a custom field mask that needs it and normalize the mask', async () => {
    await processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file, fieldMask: ' pages.formFields, pages.formFields ,' }));

    expect(process).toHaveBeenCalledWith({ auth: AUTH, processorName: PROCESSOR, request: {
      rawDocument: { content: 'JVBERi0=', mimeType: 'application/pdf', displayName: 'invoice.pdf' },
      imagelessMode: true,
      fieldMask: 'pages.formFields,pages.pageNumber,text',
    } });
  });

  it('should label form fields with the selected page number', async () => {
    process.mockResolvedValue({ document: { text: 'Nome: João', pages: [{ formFields: [{ fieldName: { textAnchor: { content: 'Nome:' } }, fieldValue: { textAnchor: { content: 'João' } } }] }] } });

    const output = await processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file, pages: '5', fieldMask: 'pages.formFields' }));

    expect(process).toHaveBeenCalledWith(expect.objectContaining({ request: expect.objectContaining({ processOptions: { individualPageSelector: { pages: [5] } }, fieldMask: 'pages.formFields,pages.pageNumber,text' }) }));
    expect(output).toMatchObject({ formFields: [{ page: 5, name: 'Nome:', value: 'João' }] });
  });

  it('should send a custom field mask that already has text or does not need it unchanged', async () => {
    await processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file, fieldMask: 'mimeType' }));
    await processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file, fieldMask: 'text,entities' }));

    expect(process).toHaveBeenNthCalledWith(1, expect.objectContaining({ request: expect.objectContaining({ fieldMask: 'mimeType' }) }));
    expect(process).toHaveBeenNthCalledWith(2, expect.objectContaining({ request: expect.objectContaining({ fieldMask: 'text,entities' }) }));
  });

  it('should send a Cloud Storage document with the MIME type taken from the URI', async () => {
    await processDocument.run(ctx({ processor: PROCESSOR, source: 'gcs', gcsUri: ' gs://bucket/in/contract.tiff ' }));

    expect(process).toHaveBeenCalledWith({ auth: AUTH, processorName: PROCESSOR, request: { gcsDocument: { gcsUri: 'gs://bucket/in/contract.tiff', mimeType: 'image/tiff' }, imagelessMode: true, fieldMask: DEFAULT_FIELD_MASK } });
  });

  it('should refuse a missing file, a bad URI and an unknown file type before calling Google', async () => {
    await expect(processDocument.run(ctx({ processor: PROCESSOR, source: 'file' }))).rejects.toThrow('Pick a file to process');
    await expect(processDocument.run(ctx({ processor: PROCESSOR, source: 'gcs', gcsUri: 'http://x' }))).rejects.toThrow('gs://bucket/path/file.pdf');
    await expect(processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file: { filename: 'blob', base64: 'AA==' } }))).rejects.toThrow('fill in MIME Type');
    expect(process).not.toHaveBeenCalled();
  });

  it('should surface a document-level error from Google', async () => {
    process.mockResolvedValue({ document: { error: { code: 3, message: 'Unsupported input file format.' } } });

    await expect(processDocument.run(ctx({ processor: PROCESSOR, source: 'file', file }))).rejects.toThrow('Document AI could not process the document: Unsupported input file format.');
  });
});
