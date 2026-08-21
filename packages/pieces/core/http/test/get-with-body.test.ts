/// <reference types="vitest/globals" />

import http from 'node:http';
import { createMockActionContext } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { httpSendRequestAction } from '../src/lib/actions/send-http-request-action';

type SeenRequest = { method: string; contentLength?: string; body: string };

let server: http.Server;
let baseUrl: string;
let status = 200;
const seen: SeenRequest[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      seen.push({
        method: req.method ?? '',
        contentLength: req.headers['content-length'],
        body,
      });
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: status < 400 }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
});

afterAll(() => server.close());

beforeEach(() => {
  seen.length = 0;
  status = 200;
});

const runCustomApiCall = (propsValue: Record<string, unknown>) =>
  createCustomApiCallAction({
    baseUrl: () => baseUrl,
    auth: undefined,
  }).run(createMockActionContext({ propsValue }));

const runSendHttpRequest = (propsValue: Record<string, unknown>) =>
  httpSendRequestAction.run(createMockActionContext({ propsValue }));

describe('FetchHttpClient body handling per method', () => {
  test.each([
    ['GET', { a: 1 }],
    ['GET', {}],
    ['GET', ''],
    ['GET', 'raw text'],
    ['HEAD', { a: 1 }],
  ] as const)('%s drops the body instead of throwing', async (method, body) => {
    const response = await httpClient.sendRequest({
      method: method as HttpMethod,
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(response.status).toBe(200);
    expect(seen[0].body).toBe('');
    expect(seen[0].contentLength).toBeUndefined();
  });

  test.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
    '%s still sends the body',
    async (method) => {
      await httpClient.sendRequest({
        method: method as HttpMethod,
        url: baseUrl,
        headers: { 'Content-Type': 'application/json' },
        body: { a: 1 },
      });
      expect(seen[0]).toMatchObject({ method, body: '{"a":1}' });
    }
  );
});

describe('Custom API Call on GET', () => {
  const base = {
    method: HttpMethod.GET,
    headers: {},
    queryParams: {},
  };

  test.each([
    ['body type cleared (legacy step)', { body: {} }],
    ['json body', { body_type: 'json', body: { data: { a: 1 } } }],
    ['empty json body', { body_type: 'json', body: { data: {} } }],
    ['raw body', { body_type: 'raw', body: { data: 'text' } }],
    ['empty raw body', { body_type: 'raw', body: { data: '' } }],
    ['form data body', {
      body_type: 'form_data',
      body: { data: [{ fieldName: 'a', fieldType: 'text', textFieldValue: '1' }] },
    }],
    ['body type none', { body_type: 'none', body: {} }],
  ])('succeeds with %s', async (_label, props) => {
    const result = await runCustomApiCall({ ...base, url: { url: baseUrl }, ...props });
    expect(result).toMatchObject({ status: 200 });
    expect(seen[0].body).toBe('');
  });

  test('POST keeps its body', async () => {
    await runCustomApiCall({
      ...base,
      method: HttpMethod.POST,
      url: { url: baseUrl },
      body_type: 'json',
      body: { data: { a: 1 } },
    });
    expect(seen[0]).toMatchObject({ method: 'POST', body: '{"a":1}' });
  });
});

describe('failsafe surfaces the real error, never TypeError', () => {
  const unreachable = 'http://127.0.0.1:1/';

  test('Custom API Call failsafe reports a transport error', async () => {
    const result = await runCustomApiCall({
      method: HttpMethod.GET,
      url: { url: unreachable },
      headers: {},
      queryParams: {},
      body_type: 'none',
      failsafe: true,
    });
    expect(result).toMatchObject({ response: { status: 0 } });
    expect(String((result as { response: { body: unknown } }).response.body)).not.toMatch(
      /is not a function/
    );
  });

  test('transport and HTTP errors report the same shape, both echoing the request body', async () => {
    const props = {
      method: HttpMethod.POST,
      headers: {},
      queryParams: {},
      body_type: 'json',
      body: { data: { sent: 'value' } },
      failsafe: true,
    };

    const transportError = await runCustomApiCall({ ...props, url: { url: unreachable } });
    status = 404;
    const httpError = await runCustomApiCall({ ...props, url: { url: baseUrl } });

    expect(transportError).toMatchObject({
      response: { status: 0 },
      request: { body: { sent: 'value' } },
    });
    expect(httpError).toMatchObject({
      response: { status: 404 },
      request: { body: { sent: 'value' } },
    });
    expect(Object.keys(transportError as object).sort()).toEqual(
      Object.keys(httpError as object).sort()
    );
  });

  test('Custom API Call failsafe still reports HTTP errors', async () => {
    status = 404;
    const result = await runCustomApiCall({
      method: HttpMethod.GET,
      url: { url: baseUrl },
      headers: {},
      queryParams: {},
      body_type: 'none',
      failsafe: true,
    });
    expect(result).toMatchObject({ response: { status: 404 } });
  });

  test.each(['continue_all', 'retry_5xx', 'continue_4xx'] as const)(
    'Send HTTP Request failureMode %s survives a transport error',
    async (failureMode) => {
      const result = await runSendHttpRequest({
        method: HttpMethod.GET,
        url: unreachable,
        headers: {},
        queryParams: {},
        failureMode,
      }).catch((error: unknown) => error);

      if (failureMode === 'continue_4xx') {
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).not.toMatch(/is not a function/);
        expect((result as Error).message).not.toMatch(/reading 'status'/);
        return;
      }
      expect(result).toMatchObject({ response: { status: 0 } });
    }
  );

  test('Send HTTP Request continue_4xx still returns 4xx payloads', async () => {
    status = 422;
    const result = await runSendHttpRequest({
      method: HttpMethod.GET,
      url: baseUrl,
      headers: {},
      queryParams: {},
      failureMode: 'continue_4xx',
    });
    expect(result).toMatchObject({ response: { status: 422 } });
  });

  test('Send HTTP Request retry_all resends a full multipart body on every attempt', async () => {
    status = 500;
    await runSendHttpRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      headers: {},
      queryParams: {},
      body_type: 'form_data',
      body: {
        data: [
          { fieldName: 'note', fieldType: 'text', textFieldValue: 'hello-multipart' },
          {
            fieldName: 'upload',
            fieldType: 'file',
            fileFieldValue: { filename: 'a.txt', data: Buffer.from('file-payload') },
          },
        ],
      },
      failureMode: 'retry_all',
    }).catch(() => undefined);

    expect(seen).toHaveLength(3);
    for (const request of seen) {
      expect(request.body).toContain('hello-multipart');
      expect(request.body).toContain('file-payload');
    }
  });
});

describe('binary responses are unaffected by the bodyless-method guard', () => {
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]);

  let binaryServer: http.Server;
  let binaryUrl: string;

  beforeAll(async () => {
    binaryServer = http.createServer((_req, res) => {
      res.writeHead(200, {
        'content-type': 'image/png',
        'content-length': String(pngBytes.length),
      });
      res.end(pngBytes);
    });
    await new Promise<void>((resolve) => binaryServer.listen(0, resolve));
    binaryUrl = `http://127.0.0.1:${(binaryServer.address() as { port: number }).port}/file.png`;
  });

  afterAll(() => binaryServer.close());

  test('GET with responseType arraybuffer still returns the bytes', async () => {
    const response = await httpClient.sendRequest<Buffer>({
      method: HttpMethod.GET,
      url: binaryUrl,
      responseType: 'arraybuffer',
    });
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect(response.body.equals(pngBytes)).toBe(true);
  });

  test('GET download works even when the step carries a body', async () => {
    const response = await httpClient.sendRequest<Buffer>({
      method: HttpMethod.GET,
      url: binaryUrl,
      responseType: 'arraybuffer',
      body: { ignored: true },
    });
    expect(response.body.equals(pngBytes)).toBe(true);
  });

  test('Custom API Call downloads a binary file on GET', async () => {
    const result = await runCustomApiCall({
      method: HttpMethod.GET,
      url: { url: binaryUrl },
      headers: {},
      queryParams: {},
      body_type: 'none',
      response_is_binary: true,
    });
    expect(result).toMatchObject({ status: 200, body: 'test-file-url' });
  });
});
