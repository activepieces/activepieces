/// <reference types="vitest/globals" />

import http from 'node:http';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { httpSendRequestAction } from '../src/lib/actions/send-http-request-action';

type SeenRequest = { wireHeaderNames: string[]; contentTypes: string[] };

let server: http.Server;
let baseUrl: string;
const seen: SeenRequest[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    req.on('data', () => undefined);
    req.on('end', () => {
      const wireHeaderNames: string[] = [];
      const contentTypes: string[] = [];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        wireHeaderNames.push(req.rawHeaders[i]);
        if (req.rawHeaders[i].toLowerCase() === 'content-type') {
          contentTypes.push(req.rawHeaders[i + 1]);
        }
      }
      seen.push({ wireHeaderNames, contentTypes });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
});

afterAll(() => server.close());

beforeEach(() => {
  seen.length = 0;
});

describe('request header name casing is preserved on the wire', () => {
  test('httpClient sends header names exactly as given', async () => {
    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      headers: { 'X-Api-Key': 'secret', myCustomHeader: 'value' },
      body: { a: 1 },
    });
    expect(seen[0].wireHeaderNames).toContain('X-Api-Key');
    expect(seen[0].wireHeaderNames).toContain('myCustomHeader');
  });

  test('send_request action sends UI-defined header names exactly as typed', async () => {
    await httpSendRequestAction.run(
      createMockActionContext({
        propsValue: {
          method: HttpMethod.GET,
          url: baseUrl,
          headers: { 'X-Api-Key': 'secret', myCustomHeader: 'value' },
          queryParams: {},
          failureMode: 'continue_none',
        },
      })
    );
    expect(seen[0].wireHeaderNames).toContain('X-Api-Key');
    expect(seen[0].wireHeaderNames).toContain('myCustomHeader');
  });

  test('duplicate names differing only in case are deduplicated, last wins', async () => {
    const formData = new FormData();
    formData.append('field', 'value');
    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      body: formData,
    });
    expect(seen[0].contentTypes).toHaveLength(1);
    expect(seen[0].contentTypes[0]).toContain('multipart/form-data');
  });
});
