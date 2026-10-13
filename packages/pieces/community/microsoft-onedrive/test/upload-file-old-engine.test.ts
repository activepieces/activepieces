/// <reference types="vitest/globals" />

import { buffer as readableToBuffer } from 'node:stream/consumers';
import { Readable } from 'node:stream';
import { ApFile, createMockActionContext } from '@activepieces/pieces-framework';
import { uploadFile } from '../src/lib/actions/upload-file';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest },
  };
});

type UploadFileContext = Parameters<typeof uploadFile.run>[0];

function buildContext(file: ApFile | { body: Readable; filename: string; extension?: string; size?: number }): UploadFileContext {
  const base = createMockActionContext({
    propsValue: {
      fileName: 'report.xlsx',
      file,
      parentId: 'root',
      markdown: undefined,
    },
  });
  return {
    ...base,
    auth: { access_token: 'test-token' },
  } as unknown as UploadFileContext;
}

describe('OneDrive upload file on engines without streaming file support', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ body: { id: 'uploaded-item-id' } });
  });

  test('uploads a buffered ApFile produced by a pre-0.87.0 engine', async () => {
    const data = Buffer.from('old-engine-spreadsheet-bytes');
    const file = new ApFile('report.xlsx', data, 'xlsx');
    Object.setPrototypeOf(file, Object.prototype);

    const result = await uploadFile.run(buildContext(file));

    expect(result).toEqual({ id: 'uploaded-item-id' });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    const request = sendRequest.mock.calls[0][0];
    expect(request.headers['Content-length']).toBe(String(data.length));
    expect(await readableToBuffer(request.body)).toEqual(data);
  });

  test('chunk-uploads a large buffered ApFile through the upload session', async () => {
    const data = Buffer.alloc(12 * 1024 * 1024);
    for (let i = 0; i < data.length; i += 4096) {
      data.writeUInt32BE(i, i);
    }
    const file = new ApFile('report.xlsx', data, 'xlsx');
    Object.setPrototypeOf(file, Object.prototype);
    sendRequest.mockResolvedValueOnce({ body: { uploadUrl: 'https://upload.example/session' } });

    const uploaded: Buffer[] = [];
    const ranges: string[] = [];
    sendRequest.mockImplementation(async ({ body, headers }) => {
      uploaded.push(Buffer.from(body));
      ranges.push(headers['Content-Range']);
      return { body: { id: 'uploaded-item-id' } };
    });

    const result = await uploadFile.run(buildContext(file));

    expect(result).toEqual({ id: 'uploaded-item-id' });
    expect(ranges).toEqual([
      `bytes 0-${10485760 - 1}/${data.length}`,
      `bytes 10485760-${data.length - 1}/${data.length}`,
    ]);
    expect(Buffer.concat(uploaded).equals(data)).toBe(true);
  });

  test('still streams an ApStreamingFile from a current engine', async () => {
    const data = Buffer.from('new-engine-streamed-bytes');
    const file = {
      filename: 'report.xlsx',
      extension: 'xlsx',
      size: data.length,
      body: Readable.from(data),
    };

    const result = await uploadFile.run(buildContext(file));

    expect(result).toEqual({ id: 'uploaded-item-id' });
    const request = sendRequest.mock.calls[0][0];
    expect(request.headers['Content-length']).toBe(String(data.length));
    expect(await readableToBuffer(request.body)).toEqual(data);
  });
});
