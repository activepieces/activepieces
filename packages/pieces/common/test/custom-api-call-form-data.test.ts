/// <reference types="vitest/globals" />

import { createRequire } from 'node:module';
import { ApFile } from '@activepieces/pieces-framework';
import { createCustomApiCallAction, httpClient, HttpMethod, HttpRequest } from '../src';

const nodeRequire = createRequire(__filename);

function isFormDataLoaded(): boolean {
  return Object.keys(nodeRequire.cache).some((path) => path.includes('/form-data/'));
}

function buildAction() {
  return createCustomApiCallAction({
    baseUrl: () => 'https://api.example.com/v1',
    authMapping: async () => ({ 'x-api-key': 'secret' }),
  });
}

async function runAction({ propsValue }: { propsValue: Record<string, unknown> }) {
  const action = buildAction();
  return action.run({
    auth: undefined,
    propsValue,
    files: { write: vi.fn() },
  } as never);
}

async function readBody(body: unknown): Promise<string> {
  const stream = body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
    stream.resume();
  });
}

describe('createCustomApiCallAction form data body', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('does not load form-data when the piece is loaded or a JSON body is sent', async () => {
    const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { ok: true } });
    expect(isFormDataLoaded()).toBe(false);

    const result = await runAction({
      propsValue: {
        method: HttpMethod.POST,
        url: { url: '/items' },
        body_type: 'json',
        body: { data: { name: 'a' } },
      },
    });

    expect(result).toEqual({ status: 200, headers: {}, body: { ok: true } });
    expect(sendRequest.mock.calls[0][0].body).toEqual({ name: 'a' });
    expect(isFormDataLoaded()).toBe(false);
  });

  test('sends text and file fields as multipart with the boundary header and the auth header', async () => {
    const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: { id: 1 } });

    await runAction({
      propsValue: {
        method: HttpMethod.POST,
        url: { url: '/upload' },
        body_type: 'form_data',
        body: {
          data: [
            { fieldName: 'title', fieldType: 'text', textFieldValue: 'Report' },
            { fieldName: 'file', fieldType: 'file', fileFieldValue: new ApFile('report.pdf', Buffer.from('%PDF-1.4 body'), 'pdf') },
            { fieldName: 'empty', fieldType: 'text', textFieldValue: '' },
          ],
        },
      },
    });

    const request = sendRequest.mock.calls[0][0] as HttpRequest;
    expect(request.url).toBe('https://api.example.com/v1/upload');
    expect(request.headers?.['x-api-key']).toBe('secret');
    const contentType = String(request.headers?.['content-type']);
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);

    const raw = await readBody(request.body);
    const boundary = contentType.split('boundary=')[1];
    expect(raw).toContain(`--${boundary}`);
    expect(raw).toContain('name="title"\r\n\r\nReport');
    expect(raw).toContain('name="file"; filename="report.pdf"');
    expect(raw).toContain('%PDF-1.4 body');
    expect(raw).not.toContain('name="empty"');
    expect(isFormDataLoaded()).toBe(true);
  });
});
