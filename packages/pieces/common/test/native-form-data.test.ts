/// <reference types="vitest/globals" />

import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { httpClient, HttpMethod } from '../src';

function startServer(): Promise<{ server: Server; url: string; received: ReceivedRequest[] }> {
  const received: ReceivedRequest[] = [];
  const server = createServer((req, res) => {
    readBody(req).then((body) => {
      received.push({ contentType: req.headers['content-type'], body });
      res.setHeader('content-type', 'application/json');
      res.end('{}');
    }).catch(() => res.destroy());
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}`, received });
    });
  });
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

describe('httpClient with a native FormData body', () => {
  let server: Server;
  let url: string;
  let received: ReceivedRequest[];

  beforeEach(async () => {
    ({ server, url, received } = await startServer());
  });

  afterEach(() => {
    server.close();
  });

  test.each([
    ['no content-type', undefined],
    ['Content-Type: multipart/form-data', { 'Content-Type': 'multipart/form-data' }],
    ['content-type: multipart/form-data', { 'content-type': 'multipart/form-data' }],
    ['Content-Type: application/json', { 'Content-Type': 'application/json' }],
  ])('sends a multipart boundary when the caller sets %s', async (_label, headers) => {
    const form = new FormData();
    form.append('name', 'report');
    form.append('file', new Blob([Buffer.from('hello')]), 'hello.txt');

    await httpClient.sendRequest({ method: HttpMethod.POST, url, headers, body: form });

    const boundary = received[0].contentType?.match(/^multipart\/form-data; boundary=(.+)$/)?.[1];
    expect(boundary).toBeDefined();
    expect(received[0].body).toContain(`--${boundary}`);
    expect(received[0].body).toContain('name="file"; filename="hello.txt"');
    expect(received[0].body).toContain('hello');
  });
});

type ReceivedRequest = {
  contentType: string | undefined;
  body: string;
};
