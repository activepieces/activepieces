/// <reference types="vitest/globals" />

import {
  ApFile,
  createMockActionContext,
  FAIL_PARENT_ON_FAILURE_HEADER,
  PARENT_RUN_ID_HEADER,
} from '@activepieces/pieces-framework';

const { sendRequest, findFlowByExternalIdOrThrow } = vi.hoisted(() => ({
  sendRequest: vi.fn(),
  findFlowByExternalIdOrThrow: vi.fn(),
}));

vi.mock('@activepieces/pieces-common', () => ({
  httpClient: { sendRequest },
  HttpMethod: { GET: 'GET', POST: 'POST' },
}));

vi.mock('../src/lib/common', () => ({
  listFlowsWithSubflowTrigger: vi.fn(),
  findFlowByExternalIdOrThrow,
}));

import { processCsvInChunks } from '../src/lib/actions/process-csv-in-chunks';

const ENABLED_SUBFLOW = {
  id: 'sub-flow-id',
  externalId: 'sub-external-id',
  status: 'ENABLED',
  version: { displayName: 'Chunk Processor' },
};

describe('processCsvInChunks action', () => {
  beforeEach(() => {
    sendRequest.mockReset().mockResolvedValue({ status: 200, body: {} });
    findFlowByExternalIdOrThrow.mockReset().mockResolvedValue(ENABLED_SUBFLOW);
  });

  test('splits the CSV into chunks of the configured size and dispatches one subflow call per chunk', async () => {
    const result = await processCsvInChunks.run(contextFor({ rowCount: 5, chunkSize: 2 }));

    expect(result).toEqual({
      dispatchedChunks: 3,
      chunkSize: 2,
      totalRows: 5,
      flowExternalId: 'sub-external-id',
    });
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(dispatchedPayloads().map((payload) => payload.rows.length)).toEqual([2, 2, 1]);
    expect(dispatchedPayloads().map((payload) => payload.chunkIndex)).toEqual([0, 1, 2]);
    expect(dispatchedPayloads().every((payload) => payload.totalChunks === 3)).toBe(true);
  });

  test('falls back to 5000 rows per chunk when the chunk size is left empty', async () => {
    const result = await processCsvInChunks.run(contextFor({ rowCount: 3, chunkSize: undefined }));

    expect(result.chunkSize).toBe(5000);
    expect(result.dispatchedChunks).toBe(1);
  });

  test.each([0, -10, Number.NaN])(
    'falls back to 5000 rows per chunk when the chunk size is %s',
    async (chunkSize) => {
      const result = await processCsvInChunks.run(contextFor({ rowCount: 3, chunkSize }));

      expect(result.chunkSize).toBe(5000);
    }
  );

  test('truncates a fractional chunk size to a whole number of rows', async () => {
    const result = await processCsvInChunks.run(contextFor({ rowCount: 5, chunkSize: 2.9 }));

    expect(result.chunkSize).toBe(2);
    expect(result.dispatchedChunks).toBe(3);
  });

  test('dispatches nothing when the CSV has no data rows', async () => {
    const result = await processCsvInChunks.run(contextFor({ rowCount: 0, chunkSize: 10 }));

    expect(result.totalRows).toBe(0);
    expect(result.dispatchedChunks).toBe(0);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('merges additionalData into every chunk payload', async () => {
    await processCsvInChunks.run(
      contextFor({ rowCount: 3, chunkSize: 2, additionalData: { batch: 'nightly' } })
    );

    expect(dispatchedPayloads()).toHaveLength(2);
    expect(dispatchedPayloads().every((payload) => payload.batch === 'nightly')).toBe(true);
  });

  test('links every chunk to the parent run without letting it fail the parent', async () => {
    await processCsvInChunks.run(contextFor({ rowCount: 3, chunkSize: 2 }));

    for (const [request] of sendRequest.mock.calls) {
      expect(request.method).toBe('POST');
      expect(request.url).toContain('v1/webhooks/sub-flow-id');
      expect(request.headers[PARENT_RUN_ID_HEADER]).toBe('test-run-id');
      expect(request.headers[FAIL_PARENT_ON_FAILURE_HEADER]).toBe('false');
    }
  });

  test('parses headerless CSVs as positional rows', async () => {
    const result = await processCsvInChunks.run(
      contextFor({ rowCount: 2, chunkSize: 10, hasHeaders: false })
    );

    expect(result.totalRows).toBe(3);
    expect(dispatchedPayloads()[0].rows[0]).toEqual(['id', 'name']);
  });

  test('honours a non-comma delimiter', async () => {
    const result = await processCsvInChunks.run(
      contextFor({ rowCount: 2, chunkSize: 10, delimiter: ';', separator: ';' })
    );

    expect(result.totalRows).toBe(2);
    expect(dispatchedPayloads()[0].rows[0]).toEqual({ id: '1', name: 'User 1' });
  });

  test('throws when the selected subflow is disabled', async () => {
    findFlowByExternalIdOrThrow.mockResolvedValue({ ...ENABLED_SUBFLOW, status: 'DISABLED' });

    await expect(processCsvInChunks.run(contextFor({ rowCount: 3, chunkSize: 2 }))).rejects.toThrow(
      /disabled/
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

function csvFile(rowCount: number, separator = ','): ApFile {
  const lines = [['id', 'name'].join(separator)];
  for (let i = 1; i <= rowCount; i++) {
    lines.push([String(i), `User ${i}`].join(separator));
  }
  return new ApFile('data.csv', Buffer.from(lines.join('\n')), 'csv');
}

function contextFor(params: {
  rowCount: number;
  chunkSize: number | undefined;
  hasHeaders?: boolean;
  delimiter?: string;
  separator?: string;
  additionalData?: Record<string, unknown>;
}) {
  return createMockActionContext({
    propsValue: {
      file: csvFile(params.rowCount, params.separator),
      flow: { externalId: 'sub-external-id' },
      chunkSize: params.chunkSize,
      hasHeaders: params.hasHeaders ?? true,
      delimiter: params.delimiter ?? ',',
      additionalData: params.additionalData,
    },
  });
}

function dispatchedPayloads(): Record<string, unknown>[] {
  return sendRequest.mock.calls.map(([request]) => request.body.data);
}
