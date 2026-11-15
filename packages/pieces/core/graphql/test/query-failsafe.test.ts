/// <reference types="vitest/globals" />

import http from 'node:http';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { query } from '../src/lib/actions/query';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
});

afterAll(() => server.close());

const runQuery = (propsValue: Record<string, unknown>) =>
  query.run(createMockActionContext({ propsValue }));

const baseProps = {
  method: HttpMethod.POST,
  headers: {},
  queryParams: {},
  query: '{ ok }',
};

describe('failsafe surfaces the real error, never TypeError', () => {
  const unreachable = 'http://127.0.0.1:1/';

  test('failsafe reports a transport error', async () => {
    const result = await runQuery({
      ...baseProps,
      url: unreachable,
      failsafe: true,
    });
    expect(result).toMatchObject({
      response: { status: 0 },
      request: { body: '{"query":"{ ok }"}' },
    });
  });

  test('failsafe still reports HTTP errors', async () => {
    const result = await runQuery({ ...baseProps, url: baseUrl, failsafe: true });
    expect(result).toMatchObject({
      response: { status: 404 },
      request: { body: '{"query":"{ ok }"}' },
    });
  });

  test('failsafe off still throws', async () => {
    await expect(runQuery({ ...baseProps, url: unreachable })).rejects.toThrow();
  });
});
