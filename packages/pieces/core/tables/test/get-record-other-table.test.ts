/// <reference types="vitest/globals" />

import { createServer, Server } from 'node:http';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { getRecord } from '../src/lib/actions/get-record';

const CUSTOMERS_TABLE = { id: 'tbl_customers', externalId: 'ext_customers' };
const IMPORTED_CUSTOMERS_TABLE = { id: 'tbl_customers_imported', externalId: CUSTOMERS_TABLE.externalId };
const ORDERS_TABLE = { id: 'tbl_orders', externalId: 'ext_orders' };
const TABLES = [CUSTOMERS_TABLE, IMPORTED_CUSTOMERS_TABLE, ORDERS_TABLE];

const CUSTOMER_RECORD = {
  id: 'rec_customer_1',
  tableId: CUSTOMERS_TABLE.id,
  created: '2026-10-01T00:00:00.000Z',
  updated: '2026-10-01T00:00:00.000Z',
  cells: {
    fld_name: { fieldName: 'Name', value: 'Ada Lovelace', created: '2026-10-01T00:00:00.000Z', updated: '2026-10-01T00:00:00.000Z' },
  },
};
const IMPORTED_CUSTOMER_RECORD = { ...CUSTOMER_RECORD, id: 'rec_customer_imported_1', tableId: IMPORTED_CUSTOMERS_TABLE.id };
const RECORDS = [CUSTOMER_RECORD, IMPORTED_CUSTOMER_RECORD];

let server: Server;
let apiUrl: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    const send = ({ status, payload }: { status: number; payload: unknown }) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    };
    const table = TABLES.find((candidate) => req.url === `/v1/tables/${candidate.id}`);
    const record = RECORDS.find((candidate) => req.url === `/v1/records/${candidate.id}`);
    const payload = table ?? record;
    if (req.method !== 'GET' || payload === undefined) {
      return send({ status: 404, payload: { message: 'not found' } });
    }
    send({ status: 200, payload });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('stand-in server has no port');
  }
  apiUrl = `http://127.0.0.1:${address.port}/`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Tables Get Record', () => {
  it('fails when the record belongs to another table', async () => {
    await expect(runGetRecord({ tableExternalId: ORDERS_TABLE.externalId, recordId: CUSTOMER_RECORD.id })).rejects.toThrow(
      `Record ${CUSTOMER_RECORD.id} not found in the selected table`,
    );
  });

  it('returns the record when it belongs to the selected table', async () => {
    const record = await runGetRecord({ tableExternalId: CUSTOMERS_TABLE.externalId, recordId: CUSTOMER_RECORD.id });

    expect(record).toEqual({
      id: CUSTOMER_RECORD.id,
      created: CUSTOMER_RECORD.created,
      updated: CUSTOMER_RECORD.updated,
      cells: CUSTOMER_RECORD.cells,
    });
  });

  it('returns the record when its table is an imported copy sharing the selected external id', async () => {
    const record = await runGetRecord({ tableExternalId: CUSTOMERS_TABLE.externalId, recordId: IMPORTED_CUSTOMER_RECORD.id });

    expect(record).toMatchObject({ id: IMPORTED_CUSTOMER_RECORD.id });
  });
});

function runGetRecord({ tableExternalId, recordId }: { tableExternalId: string; recordId: string }) {
  const context = createMockActionContext<typeof getRecord.props>({
    propsValue: { table_id: tableExternalId, record_id: recordId },
  });
  return getRecord.run({ ...context, server: { ...context.server, apiUrl } });
}
