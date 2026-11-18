/// <reference types="vitest/globals" />

import http from 'http';
import { ApifyClient } from 'apify-client';
import { handleRun } from '../src/lib/common';

vi.mock('../src/index', () => ({ apifyAuth: {} }));

const RUN_ID = 'run_fixture';
const ACTOR_ID = 'actor_fixture';
const TASK_ID = 'task_fixture';
const DATASET_ID = 'dataset_fixture';

let server: http.Server;
let baseUrl: string;
let unhandled: unknown[];
const recordUnhandled = (reason: unknown) => {
  unhandled.push(reason);
};

beforeEach(async () => {
  unhandled = [];
  process.on('unhandledRejection', recordUnhandled);
  server = http.createServer(fakeApifyApi);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('fake Apify server has no port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  process.off('unhandledRejection', recordUnhandled);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('a dropped actor log stream does not surface as an unhandled rejection', async () => {
  const client = new ApifyClient({ token: 'token', baseUrl, maxRetries: 0 });

  const result = await handleRun({
    resourceClient: client.actor(ACTOR_ID),
    body: {},
    runOptions: {},
    waitForFinish: true,
    client,
  });
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(result.run.status).toBe('SUCCEEDED');
  expect(result.datasetItems).toEqual([{ id: 1 }]);
  expect(unhandled).toEqual([]);
});

test('a task run waits for finish without a log option', async () => {
  const client = new ApifyClient({ token: 'token', baseUrl, maxRetries: 0 });

  const result = await handleRun({
    resourceClient: client.task(TASK_ID),
    body: {},
    runOptions: {},
    waitForFinish: true,
    client,
  });
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(result.run.status).toBe('SUCCEEDED');
  expect(result.datasetItems).toEqual([{ id: 1 }]);
  expect(unhandled).toEqual([]);
});

function fakeApifyApi(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname.startsWith(`/v2/logs/${RUN_ID}`) || url.pathname.startsWith(`/v2/actor-runs/${RUN_ID}/log`)) {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.write('2026-11-16T14:16:21.469Z ACTOR: Pulling container image\n');
    setTimeout(() => res.socket?.destroy(), 20);
    return;
  }
  if (url.pathname === `/v2/actor-tasks/${TASK_ID}/runs` && req.method === 'POST') {
    sendJson(res, { data: run('RUNNING') });
    return;
  }
  if (url.pathname === `/v2/acts/${ACTOR_ID}/runs` && req.method === 'POST') {
    sendJson(res, { data: run('RUNNING') });
    return;
  }
  if (url.pathname === `/v2/actor-runs/${RUN_ID}`) {
    if (url.searchParams.has('waitForFinish')) {
      setTimeout(() => sendJson(res, { data: run('SUCCEEDED') }), 200);
      return;
    }
    sendJson(res, { data: run('RUNNING') });
    return;
  }
  if (url.pathname === `/v2/acts/${ACTOR_ID}`) {
    sendJson(res, { data: { id: ACTOR_ID, name: 'fixture-actor' } });
    return;
  }
  if (url.pathname === `/v2/datasets/${DATASET_ID}/items`) {
    res.writeHead(200, {
      'content-type': 'application/json',
      'x-apify-pagination-total': '1',
      'x-apify-pagination-offset': '0',
      'x-apify-pagination-count': '1',
      'x-apify-pagination-limit': '1000',
    });
    res.end(JSON.stringify([{ id: 1 }]));
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: { type: 'record-not-found', message: url.pathname } }));
}

function sendJson(res: http.ServerResponse, body: unknown) {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function run(status: string) {
  return {
    id: RUN_ID,
    actId: ACTOR_ID,
    status,
    defaultDatasetId: DATASET_ID,
    startedAt: '2026-11-16T14:16:20.000Z',
  };
}
