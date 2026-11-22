import { HttpError, httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/core-piece-types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { updateRecord } from '../src/lib/actions/update-record';
import { insightlyClient, InsightlyError, insightlyUtils, RequestParams } from '../src/lib/common/client';
import { insightlyCommon } from '../src/lib/common/common';
import { deletedRecordInternals } from '../src/lib/triggers/deleted-record';
import { insightly } from '../src';

function makeRows({ count, offset = 0 }: { count: number; offset?: number }): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, index) => ({ CONTACT_ID: offset + index + 1, FIRST_NAME: `C${offset + index + 1}` }));
}

function pagedRequester({ rows }: { rows: Record<string, unknown>[] }) {
  const calls: RequestParams[] = [];
  const requester = async (params: RequestParams) => {
    calls.push(params);
    const skip = Number(params.query?.['skip'] ?? '0');
    const top = Number(params.query?.['top'] ?? '500');
    return rows.slice(skip, skip + top);
  };
  return { calls, requester };
}

beforeEach(() => {
  insightlyUtils.clearPodCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolvePod', () => {
  test('explicit pod wins and is normalized', async () => {
    const requester = async () => {
      throw new Error('should not probe');
    };
    await expect(insightlyClient.resolvePod({ apiKey: 'k', pod: ' EU1 ', requester })).resolves.toBe('eu1');
  });

  test('rejects pods that could change the host', async () => {
    await expect(insightlyClient.resolvePod({ apiKey: 'k', pod: 'evil.com/x' })).rejects.toBeInstanceOf(InsightlyError);
  });

  test('probes candidates until one answers', async () => {
    const tried: string[] = [];
    const requester = async (params: RequestParams) => {
      tried.push(params.pod);
      if (params.pod !== 'eu1') {
        throw new InsightlyError({ message: 'no', status: 401 });
      }
      return {};
    };
    await expect(insightlyClient.resolvePod({ apiKey: 'k', requester })).resolves.toBe('eu1');
    expect(tried).toEqual(['na1', 'na2', 'eu1']);
  });

  test('fails with a clear error when every pod rejects the key', async () => {
    const requester = async () => {
      throw new InsightlyError({ message: 'no', status: 401 });
    };
    await expect(insightlyClient.resolvePod({ apiKey: 'bad', requester })).rejects.toMatchObject({ status: 401 });
  });
});

describe('id keys', () => {
  test('opportunities map to OPPORTUNITY_ID', () => {
    expect(insightlyCommon.idKeyFor('Opportunities')).toBe('OPPORTUNITY_ID');
    expect(insightlyCommon.idKeyFor('Organisations')).toBe('ORGANISATION_ID');
    expect(insightlyCommon.idKeyFor('Quotations')).toBe('QUOTATION_ID');
  });

  test('unknown object types throw', () => {
    expect(() => insightlyCommon.idKeyFor('Users')).toThrow(InsightlyError);
  });

  test('toId rejects path segments', () => {
    expect(() => insightlyUtils.toId({ value: '12/../Users', label: 'Record' })).toThrow(InsightlyError);
    expect(insightlyUtils.toId({ value: ' 42 ', label: 'Record' })).toBe(42);
  });
});

describe('paginate', () => {
  test('reads every page and stops on a short page', async () => {
    const { calls, requester } = pagedRequester({ rows: makeRows({ count: 1200 }) });
    const result = await insightlyClient.paginate({ apiKey: 'k', pod: 'na1', path: '/Contacts', requester });
    expect(result.records).toHaveLength(1200);
    expect(result.hasMore).toBe(false);
    expect(calls.map((call) => call.query?.['skip'])).toEqual(['0', '500', '1000']);
  });

  test('respects a limit and reports more results', async () => {
    const { requester } = pagedRequester({ rows: makeRows({ count: 30 }) });
    const result = await insightlyClient.paginate({ apiKey: 'k', pod: 'na1', path: '/Contacts', limit: 10, requester });
    expect(result.records).toHaveLength(10);
    expect(result.hasMore).toBe(true);
  });

  test('throws instead of silently capping unbounded reads', async () => {
    const { requester } = pagedRequester({ rows: makeRows({ count: 30 }) });
    await expect(insightlyClient.paginate({ apiKey: 'k', pod: 'na1', path: '/Contacts', pageSize: 10, maxRecords: 20, requester })).rejects.toBeInstanceOf(InsightlyError);
  });
});

describe('sanitize', () => {
  test('drops secret-like keys at any depth', () => {
    const clean = insightlyUtils.sanitize({ USER_ID: 1, API_KEY: 'x', nested: [{ apiKey: 'y', token: 'z', NAME: 'n' }] });
    expect(clean).toEqual({ USER_ID: 1, nested: [{ NAME: 'n' }] });
  });
});

describe('errors', () => {
  test('carry responseBody and never the request body', () => {
    const error = insightlyUtils.toInsightlyError(new HttpError({ SECRET_NOTE: 'request-data' }, { status: 400, responseBody: { Message: 'Bad field' } }));
    expect(error.message).toContain('Bad field');
    expect(error.message).not.toContain('request-data');
    expect(error.responseBody).toEqual({ Message: 'Bad field' });
    expect(error).not.toHaveProperty('body');
  });
});

describe('deleted record poller', () => {
  test('1200 rows across 3 pages produce no false deletions', async () => {
    const rows = makeRows({ count: 1200 });
    const shuffled = [...rows.slice(700), ...rows.slice(0, 700)];
    const { requester } = pagedRequester({ rows: shuffled });
    const { records } = await insightlyClient.paginate({ apiKey: 'k', pod: 'na1', path: '/Contacts', requester });
    const stored: Record<string, [number, string]> = Object.fromEntries(rows.map((row): [string, [number, string]] => [String(row['CONTACT_ID']), [0, 'x']]));
    const { deleted, nextStored } = deletedRecordInternals.detectDeletions({ stored, records, nowMs: 60 * 60 * 1000, objectType: 'Contacts' });
    expect(deleted).toEqual([]);
    expect(Object.keys(nextStored)).toHaveLength(1200);
  });

  test('reports a record missing past the threshold', () => {
    const stored: Record<string, [number, string]> = { '1': [0, 'Gone'], '2': [50, 'Recent'] };
    const { deleted, nextStored } = deletedRecordInternals.detectDeletions({ stored, records: [], nowMs: 60 * 60 * 1000, objectType: 'Contacts' });
    expect(deleted.map((item) => [item.recordId, item.recordName])).toEqual([[1, 'Gone']]);
    expect(Object.keys(nextStored)).toEqual(['2']);
  });
});

describe('piece metadata', () => {
  test('audiences and output schemas', () => {
    const actions = Object.values(insightly.actions());
    const ai = actions.filter((action) => action.audience === 'ai');
    const human = actions.filter((action) => action.audience === 'human');
    expect(ai).toHaveLength(28);
    expect(human).toHaveLength(8);
    expect(actions.every((action) => action.outputSchema !== undefined)).toBe(true);
    expect(ai.every((action) => action.aiMetadata !== undefined && action.name.startsWith('ai_'))).toBe(true);
    expect(Object.values(insightly.triggers()).every((trigger) => trigger.outputSchema !== undefined)).toBe(true);
  });
});

describe('update_record', () => {
  function runUpdate({ fields }: { fields: Record<string, unknown> }) {
    const base = createMockActionContext<typeof updateRecord.props>({
      propsValue: { pod: 'na1', objectName: 'Opportunities', recordId: 7, fields },
    });
    return updateRecord.run({ ...base, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'key' } });
  }

  test('sends only filled fields with the correct id key', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { OPPORTUNITY_ID: 7, OPPORTUNITY_NAME: 'Deal' } });
    await runUpdate({ fields: { OPPORTUNITY_NAME: 'Deal', OPPORTUNITY_DETAILS: '', PROBABILITY: undefined, BID_AMOUNT: null } });
    expect(send).toHaveBeenCalledTimes(1);
    const request = send.mock.calls[0][0];
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('https://api.na1.insightly.com/v3.1/Opportunities');
    expect(request.body).toEqual({ OPPORTUNITY_NAME: 'Deal', OPPORTUNITY_ID: 7 });
  });

  test('throws without calling the API when no field is filled', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest');
    await expect(runUpdate({ fields: { OPPORTUNITY_NAME: '', PROBABILITY: undefined } })).rejects.toThrow('Fill in at least one field');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('exact search', () => {
  test('drops prefix matches returned by Insightly search', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: [{ ORGANISATION_ID: 1, ORGANISATION_NAME: 'Acme' }, { ORGANISATION_ID: 2, ORGANISATION_NAME: 'Acme Labs' }, { ORGANISATION_ID: 3, ORGANISATION_NAME: 'ACME' }],
    });
    const result = await insightlyCommon.findRecords({ connection: { apiKey: 'k', pod: 'na1' }, objectName: 'Organisations', filter: { field: 'ORGANISATION_NAME', value: 'acme' }, limit: 25 });
    expect(result.records.map((record) => record['ORGANISATION_ID'])).toEqual([1, 3]);
    expect(result.hasMore).toBe(false);
  });

  test('404 explains the module may be missing', () => {
    const error = insightlyUtils.toInsightlyError(new HttpError({}, { status: 404, responseBody: '' }));
    expect(error.message).toContain('may not exist on your Insightly plan');
  });
});
