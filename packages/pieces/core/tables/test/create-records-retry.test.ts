/// <reference types="vitest/globals" />

import http from 'node:http';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { createRecords } from '../src/lib/actions/create-records';

let server: http.Server;
let apiUrl: string;
let lostReply: LostReply | null = null;
let recordPosts = 0;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const send = ({ status, payload }: { status: number; payload: unknown }) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(payload));
      };
      if (req.method === 'GET' && req.url?.startsWith('/v1/tables')) {
        return send({ status: 200, payload: { data: [{ id: 'tbl_1', externalId: 'ext_1', name: 'T' }], next: null, previous: null } });
      }
      if (req.method === 'GET' && req.url?.startsWith('/v1/fields')) {
        return send({ status: 200, payload: [{ id: 'fld_1', name: 'Name', externalId: 'name', type: 'TEXT', tableId: 'tbl_1' }] });
      }
      if (req.method === 'POST' && req.url === '/v1/records') {
        recordPosts++;
        if (recordPosts === 1 && lostReply === 'proxy 503') {
          return send({ status: 503, payload: { message: 'upstream unavailable' } });
        }
        if (recordPosts === 1 && lostReply === 'dropped connection') {
          return req.socket.destroy();
        }
        const records: unknown[] = JSON.parse(body).records;
        return send({ status: 201, payload: records.map((_, i) => ({ id: `rec_${i}`, created: '', updated: '', cells: {} })) });
      }
      send({ status: 404, payload: {} });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('test server has no port');
  }
  apiUrl = `http://127.0.0.1:${address.port}/`;
});

afterAll(() => server.close());

beforeEach(() => {
  lostReply = null;
  recordPosts = 0;
});

function runCreateRecords() {
  const base = createMockActionContext<typeof createRecords.props>({
    propsValue: { table_id: 'ext_1', values: {}, records: { Name: 'Ada' } },
  });
  return createRecords.run({ ...base, server: { ...base.server, apiUrl } });
}

describe('Tables "Create Record(s)"', () => {
  test.each<LostReply>(['proxy 503', 'dropped connection'])(
    'fails without inserting again when a committed insert loses its reply (%s)',
    async (reply) => {
      lostReply = reply;
      const error = await runCreateRecords().catch((e: unknown) => e);
      expect(recordPosts).toBe(1);
      expect(error).toBeInstanceOf(Error);
    }
  );

  test('returns the created records when the insert succeeds', async () => {
    await expect(runCreateRecords()).resolves.toEqual([{ id: 'rec_0', created: '', updated: '', cells: {} }]);
    expect(recordPosts).toBe(1);
  });
});

type LostReply = 'proxy 503' | 'dropped connection';
