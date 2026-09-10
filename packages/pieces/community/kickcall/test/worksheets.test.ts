/// <reference types="vitest/globals" />

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  AuthenticationType: {
    BEARER_TOKEN: 'BEARER_TOKEN',
  },
  HttpMethod: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
  },
  httpClient: {
    sendRequest: (...args: unknown[]) => sendRequest(...args),
  },
}));

import { kickcallWorksheets } from '../src/lib/common/worksheets';

const auth = {
  props: {
    apiKey: 'test-api-key',
    email: 'biz@example.com',
  },
};

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body, status: 200 });
}

const columnsPayload = {
  data: [
    {
      id: 10,
      name: 'Phone',
      data_type: 'text',
      hidden: false,
      required: true,
    },
    {
      id: 11,
      name: 'Note',
      data_type: 'text',
      hidden: false,
      required: false,
    },
  ],
};

describe('kickcallWorksheets mutations', () => {
  beforeEach(() => sendRequest.mockReset());

  test('addWorksheetRow loads columns before POST and maps cells by column name', async () => {
    reply(columnsPayload);
    reply({
      id: 99,
      position: 1,
      cells: [
        { column_id: 10, value: '+15551234567' },
        { column_id: 11, value: 'hello' },
      ],
    });

    await expect(
      kickcallWorksheets.addWorksheetRow({
        auth,
        locationId: '1',
        agentId: '2',
        worksheetId: '3',
        values: { '10': '+15551234567', '11': 'hello' },
      }),
    ).resolves.toEqual({
      id: '99',
      position: 1,
      values: {
        Phone: '+15551234567',
        Note: 'hello',
      },
    });

    expect(sendRequest.mock.calls[0]?.[0].method).toBe('GET');
    expect(sendRequest.mock.calls[1]?.[0]).toMatchObject({
      method: 'POST',
      queryParams: { include: 'cells' },
      body: {
        row: {
          values: { '10': '+15551234567', '11': 'hello' },
        },
      },
    });
  });

  test('addWorksheetRow throws when create response is malformed', async () => {
    reply(columnsPayload);
    reply({ not: 'a-row' });

    await expect(
      kickcallWorksheets.addWorksheetRow({
        auth,
        locationId: '1',
        agentId: '2',
        worksheetId: '3',
        values: { '10': 'x' },
      }),
    ).rejects.toThrow(/did not return a valid row/i);
  });

  test('updateWorksheetRow PUTs values including cleared columns', async () => {
    reply(columnsPayload);
    reply({
      id: 99,
      position: 1,
      cells: [
        { column_id: 10, value: 'kept' },
        { column_id: 11, value: null },
      ],
    });

    await expect(
      kickcallWorksheets.updateWorksheetRow({
        auth,
        locationId: '1',
        agentId: '2',
        worksheetId: '3',
        rowId: '99',
        values: { '10': 'kept', '11': '' },
      }),
    ).resolves.toEqual({
      id: '99',
      position: 1,
      values: {
        Phone: 'kept',
        Note: '',
      },
    });

    expect(sendRequest.mock.calls[1]?.[0]).toMatchObject({
      method: 'PUT',
      body: {
        row: {
          values: { '10': 'kept', '11': '' },
        },
      },
    });
  });
});

describe('kickcallWorksheets lists', () => {
  beforeEach(() => sendRequest.mockReset());

  test('listWorksheetRows maps paginated rows and ignores unknown cells', async () => {
    reply(columnsPayload);
    reply({
      data: [
        {
          id: 1,
          position: 0,
          cells: [
            { column_id: 10, value: 'a' },
            { column_id: 999, value: 'ignored' },
          ],
        },
      ],
      meta: { total_pages: 1 },
    });

    await expect(
      kickcallWorksheets.listWorksheetRows({
        auth,
        locationId: '1',
        agentId: '2',
        worksheetId: '3',
      }),
    ).resolves.toEqual([
      {
        id: '1',
        position: 0,
        values: {
          Phone: 'a',
        },
      },
    ]);
  });

  test('findWorksheetRows applies filters and respects limit', async () => {
    reply(columnsPayload);
    reply({
      data: [
        {
          id: 1,
          position: 0,
          cells: [{ column_id: 10, value: 'Ada' }],
        },
        {
          id: 2,
          position: 1,
          cells: [{ column_id: 10, value: 'Adam' }],
        },
      ],
    });

    const rows = await kickcallWorksheets.findWorksheetRows({
      auth,
      locationId: '1',
      agentId: '2',
      worksheetId: '3',
      columnId: '10',
      searchValue: 'Ada',
      matchType: 'cont',
      limit: 1,
    });

    expect(rows).toEqual([
      {
        id: '1',
        position: 0,
        values: {
          Phone: 'Ada',
        },
      },
    ]);
    expect(sendRequest.mock.calls[1]?.[0].queryParams).toMatchObject({
      include: 'cells',
      per_page: '1',
      page: '1',
      'filter[0][column_id]': '10',
      'filter[0][operation]': 'cont',
      'filter[0][value]': 'Ada',
    });
  });
});
