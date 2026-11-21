import { httpClient, HttpError, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findProfileAction } from '../../src/lib/actions/find-profile';
import { getCaseAction } from '../../src/lib/actions/get-case';
import { runReportAction } from '../../src/lib/actions/run-report';
import { searchCasesAction } from '../../src/lib/actions/search-cases';
import { sprinklrCase } from '../../src/lib/common/case';
import { sprinklrTiming } from '../../src/lib/common/client';
import { pieceRunner, RunnableAction, shape } from '../support/piece-runner';

const AUTH = {
  access_token: 'token-1',
  client_id: 'key-1',
  props: { base: 'https://api3.sprinklr.com/prod2', callback: 'https://cloud.activepieces.com/redirect' },
};
const API = 'https://api3.sprinklr.com/prod2/api/v3';

function run({ action, propsValue }: { action: RunnableAction; propsValue: Record<string, unknown> }): Promise<unknown> {
  return pieceRunner.runAction({ action, auth: AUTH, propsValue });
}

function mockResponses(responses: Array<{ status: number; body: unknown } | Error>) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const response of responses) {
    if (response instanceof Error) {
      spy.mockRejectedValueOnce(response);
    } else {
      spy.mockResolvedValueOnce(response);
    }
  }
  return spy;
}

function requests(spy: ReturnType<typeof mockResponses>): HttpRequest[] {
  return spy.mock.calls.map((call) => call[0]);
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError(undefined, { status, responseBody: body });
}

const RAW_CASE = {
  id: 'c-1',
  caseNumber: 1234,
  subject: 'Broken lid',
  description: 'Arrived broken',
  status: 'Open',
  priority: 'High',
  caseType: 'Complaint',
  version: 3,
  dueDate: 1763337600000,
  summary: 'sum',
  createdTime: 1763200800000,
  modifiedTime: 1763204400000,
  contact: { id: 'EMAIL_a@b.com', name: 'Jane', channelType: 'EMAIL', channelId: 'a@b.com', fromSnUserId: 'x' },
  workflow: {
    assignment: { assigneeId: 'u1', assigneeType: 'USER', assignedById: 'u2', assignmentTime: 1 },
    customProperties: { cf1: ['v1'] },
    queues: [{ queueId: 5001, assignmentTime: 2 }],
    extra: true,
  },
  firstMessageId: 'm1',
  latestMessageId: 'm2',
  sentiment: -1,
  externalCase: { channelType: 'X' },
  deleted: false,
  smartSummary: { ignored: true },
};

beforeEach(() => {
  vi.spyOn(sprinklrTiming, 'sleep').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sprinklrCase.normalize', () => {
  it('keeps the planned fields and drops the rest', () => {
    const out = sprinklrCase.normalize(RAW_CASE);
    expect(out).toEqual({
      id: 'c-1',
      caseNumber: 1234,
      subject: 'Broken lid',
      description: 'Arrived broken',
      status: 'Open',
      priority: 'High',
      caseType: 'Complaint',
      version: 3,
      dueDate: 1763337600000,
      summary: 'sum',
      createdTime: 1763200800000,
      modifiedTime: 1763204400000,
      contact: { id: 'EMAIL_a@b.com', name: 'Jane', channelType: 'EMAIL', channelId: 'a@b.com' },
      workflow: {
        assignment: { assigneeId: 'u1', assigneeType: 'USER', assignedById: 'u2', assignmentTime: 1 },
        customProperties: { cf1: ['v1'] },
        queues: [{ queueId: '5001', assignmentTime: 2 }],
      },
      firstMessageId: 'm1',
      latestMessageId: 'm2',
      sentiment: -1,
      externalCase: { channelType: 'X' },
      deleted: false,
    });
  });

  it('turns missing fields into null', () => {
    const out = sprinklrCase.normalize({ id: 'c-2' });
    expect(out.id).toBe('c-2');
    expect(out.caseNumber).toBeNull();
    expect(out.contact).toBeNull();
    expect(out.workflow).toBeNull();
    expect(out.deleted).toBeNull();
    expect(Object.keys(out)).toEqual(Object.keys(sprinklrCase.sampleData));
  });

  it('has sample data with the same keys as a normalized case', () => {
    expect(sprinklrCase.normalize(sprinklrCase.sampleData)).toEqual(sprinklrCase.sampleData);
  });
});

describe('get_case', () => {
  it('gets by case number and returns the first item', async () => {
    const spy = mockResponses([{ status: 200, body: { data: [RAW_CASE], errors: [] } }]);
    const out = shape.record(await run({ action: getCaseAction, propsValue: { find_by: 'case_number', value: ' #1234 ' } }));
    expect(out['caseNumber']).toBe(1234);
    const [req] = requests(spy);
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe(`${API}/case?caseNumber=1234`);
  });

  it('gets by case ID', async () => {
    const spy = mockResponses([{ status: 200, body: [RAW_CASE] }]);
    await run({ action: getCaseAction, propsValue: { find_by: 'case_id', value: 'c-1' } });
    expect(requests(spy)[0].url).toBe(`${API}/case?id=c-1`);
  });

  it('throws a clear error when the list is empty', async () => {
    mockResponses([{ status: 200, body: { data: [], errors: [] } }]);
    await expect(run({ action: getCaseAction, propsValue: { find_by: 'case_number', value: '99' } })).rejects.toThrow(
      'No Sprinklr case has number 99. Check the case number.',
    );
  });

  it('throws a clear error on a 404', async () => {
    mockResponses([httpError({ status: 404, body: { errors: [{ code: 'NOT_FOUND', message: 'case.not.found' }] } })]);
    await expect(run({ action: getCaseAction, propsValue: { find_by: 'case_id', value: 'nope' } })).rejects.toThrow(
      'No Sprinklr case has ID nope. Check the case ID.',
    );
  });

  it('rejects a case number that is not digits before calling Sprinklr', async () => {
    const spy = mockResponses([]);
    await expect(run({ action: getCaseAction, propsValue: { find_by: 'case_number', value: 'abc' } })).rejects.toThrow('is not a case number');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('search_cases', () => {
  it('builds the body from the simple filters', async () => {
    const spy = mockResponses([{ status: 200, body: { data: { results: [RAW_CASE], count: 1 }, errors: [] } }]);
    const out = shape.record(await run({ action: searchCasesAction, propsValue: {
      keyword: ' refund ',
      created_after: '2026-11-01T00:00:00.000Z',
      created_before: '2026-11-02T00:00:00.000Z',
      modified_after: '2026-11-01T12:00:00.000Z',
      queue_id: '5001',
      custom_fields: { cf1: 'gold', cf2: ['a', 'b'], empty: '' },
      max_results: 10,
    } }));
    const [req] = requests(spy);
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe(`${API}/search/case`);
    expect(req.body).toEqual({
      q: 'refund',
      filter: {
        type: 'AND',
        filters: [
          { type: 'GT', key: 'createdTime', values: [String(Date.parse('2026-11-01T00:00:00.000Z'))] },
          { type: 'LT', key: 'createdTime', values: [String(Date.parse('2026-11-02T00:00:00.000Z'))] },
          { type: 'GT', key: 'modifiedTime', values: [String(Date.parse('2026-11-01T12:00:00.000Z'))] },
          { type: 'IN', key: 'workflow.queues.queueId', values: ['5001'] },
          { type: 'IN', key: 'workflow.customProperties.cf1', values: ['gold'] },
          { type: 'IN', key: 'workflow.customProperties.cf2', values: ['a', 'b'] },
        ],
      },
      sorts: [{ key: 'createdTime', order: 'DESC' }],
      page: { size: 10 },
    });
    expect(out['count']).toBe(1);
    expect(out['totalCount']).toBe(1);
    expect(shape.list(out['cases'])[0]).toEqual(sprinklrCase.normalize(RAW_CASE));
  });

  it('sends no filter when none is set and uses the chosen sort', async () => {
    const spy = mockResponses([{ status: 200, body: { results: [] } }]);
    const out = await run({ action: searchCasesAction, propsValue: { sort_by: 'modifiedTime', sort_order: 'ASC' } });
    expect(requests(spy)[0].body).toEqual({ sorts: [{ key: 'modifiedTime', order: 'ASC' }], page: { size: 20 } });
    expect(out).toEqual({ count: 0, totalCount: null, cases: [] });
  });

  it('lets Raw Filter replace the simple filters', async () => {
    const spy = mockResponses([{ status: 200, body: { results: [] } }]);
    const raw = { type: 'IN', key: 'caseNumber', values: ['1', '2'] };
    await run({ action: searchCasesAction, propsValue: { queue_id: '5001', created_after: '2026-11-01T00:00:00Z', raw_filter: JSON.stringify(raw) } });
    expect(shape.record(requests(spy)[0].body)['filter']).toEqual(raw);
  });

  it('rejects a Raw Filter that is not JSON', async () => {
    const spy = mockResponses([]);
    await expect(run({ action: searchCasesAction, propsValue: { raw_filter: '{nope' } })).rejects.toThrow('Raw Filter is not valid JSON');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects a date it cannot read', async () => {
    mockResponses([]);
    await expect(run({ action: searchCasesAction, propsValue: { created_after: 'yesterday-ish' } })).rejects.toThrow('Created After is not a valid date');
  });

  it('pages with the cursor until Max Results and caps Max Results at 200', async () => {
    const page = ({ from, n }: { from: number; n: number }) => Array.from({ length: n }, (_, i) => ({ ...RAW_CASE, id: `c${from + i}`, caseNumber: from + i }));
    const spy = mockResponses([
      { status: 200, body: { data: { results: page({ from: 0, n: 100 }), cursor: 'id=cur-1', count: 500 }, errors: [] } },
      { status: 200, body: { data: { results: page({ from: 100, n: 100 }), cursor: 'cur-2', count: 500 }, errors: [] } },
      { status: 200, body: { data: { results: page({ from: 200, n: 100 }), cursor: 'cur-3', count: 500 }, errors: [] } },
    ]);
    const out = shape.record(await run({ action: searchCasesAction, propsValue: { max_results: 5000 } }));
    const reqs = requests(spy);
    expect(reqs).toHaveLength(2);
    expect(shape.record(reqs[0].body)['page']).toEqual({ size: 100 });
    expect(reqs[1].method).toBe(HttpMethod.GET);
    expect(reqs[1].url).toBe(`${API}/search/case?id=cur-1`);
    expect(out['count']).toBe(200);
    expect(out['totalCount']).toBe(500);
    expect(shape.record(shape.list(out['cases'])[199])['id']).toBe('c199');
  });
});

describe('find_profile', () => {
  const PROFILE = {
    id: 'p-1',
    contact: { fullName: 'Jane Doe', email: 'jane@example.com', phoneNo: '+15550100', extra: 'x' },
    profiles: [{ channelType: 'TWITTER', channelId: '42', username: 'jane', name: 'Jane', followers: 9 }],
    createdTime: 1,
    modifiedTime: 2,
    demographics: {},
  };
  const FOUND = {
    found: true,
    id: 'p-1',
    contact: { fullName: 'Jane Doe', email: 'jane@example.com', phoneNo: '+15550100' },
    profiles: [{ channelType: 'TWITTER', channelId: '42', username: 'jane', name: 'Jane' }],
    createdTime: 1,
    modifiedTime: 2,
  };

  it('finds by profile ID with GET /profile?id=', async () => {
    const spy = mockResponses([{ status: 200, body: [PROFILE] }]);
    expect(await run({ action: findProfileAction, propsValue: { find_by: 'profile_id', value: 'p-1' } })).toEqual(FOUND);
    const [req] = requests(spy);
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe(`${API}/profile?id=p-1`);
  });

  it('finds by channel with an encoded TYPE~ID value', async () => {
    const spy = mockResponses([{ status: 200, body: { data: [PROFILE], errors: [] } }]);
    expect(await run({ action: findProfileAction, propsValue: { find_by: 'channel_id', value: 'jane@example.com', channel_type: 'email' } })).toEqual(FOUND);
    expect(requests(spy)[0].url).toBe(`${API}/profile?channelTypeChannelId=EMAIL%7Ejane%40example.com`);
  });

  it('needs a channel type for the channel option', async () => {
    const spy = mockResponses([]);
    await expect(run({ action: findProfileAction, propsValue: { find_by: 'channel_id', value: '42' } })).rejects.toThrow('Enter the Channel Type');
    expect(spy).not.toHaveBeenCalled();
  });

  it('finds by email through POST /search/profile with contact.email', async () => {
    const spy = mockResponses([{ status: 200, body: { data: { results: [PROFILE], cursor: 'more', count: 3 }, errors: [] } }]);
    expect(await run({ action: findProfileAction, propsValue: { find_by: 'email', value: 'jane@example.com' } })).toEqual(FOUND);
    const reqs = requests(spy);
    expect(reqs).toHaveLength(1);
    expect(reqs[0].method).toBe(HttpMethod.POST);
    expect(reqs[0].url).toBe(`${API}/search/profile`);
    expect(reqs[0].body).toEqual({ filter: { type: 'IN', key: 'contact.email', values: ['jane@example.com'] }, page: { size: 1 } });
  });

  it.each([
    ['an empty list', 'profile_id', { status: 200, body: { data: [], errors: [] } }],
    ['an empty search', 'email', { status: 200, body: { results: [] } }],
    ['a 404', 'channel_id', httpError({ status: 404, body: { errors: [{ code: 'NOT_FOUND', message: 'profile.not.found' }] } })],
  ])('returns found: false on %s', async (_name, findBy, response) => {
    mockResponses([response]);
    expect(await run({ action: findProfileAction, propsValue: { find_by: findBy, value: 'x', channel_type: 'SMS' } })).toEqual({
      found: false,
      id: null,
      contact: null,
      profiles: [],
      createdTime: null,
      modifiedTime: null,
    });
  });

  it('still throws other errors', async () => {
    mockResponses([httpError({ status: 401, body: { errors: [{ code: 'UNAUTHORIZED', message: 'bad token' }] } })]);
    await expect(run({ action: findProfileAction, propsValue: { find_by: 'profile_id', value: 'x' } })).rejects.toThrow('Sprinklr rejected the connection');
  });
});

describe('run_report', () => {
  const PAYLOAD = { reportingEngine: 'PLATFORM', report: 'CASE', startTime: 1, endTime: 2, page: 0, pageSize: 50, timeZone: 'UTC' };

  it('sends the payload with jsonResponse and returns rows', async () => {
    const spy = mockResponses([
      { status: 200, body: { data: { data: [{ Queue: 'A', Cases: 3 }], hasMore: true }, errors: [], metadata: {} } },
    ]);
    const out = await run({ action: runReportAction, propsValue: { payload: PAYLOAD } });
    const [req] = requests(spy);
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe(`${API}/reports/query`);
    expect(req.body).toEqual({ ...PAYLOAD, jsonResponse: true });
    expect(out).toEqual({ rowCount: 1, hasMore: true, rows: [{ Queue: 'A', Cases: 3 }] });
  });

  it('parses a JSON string payload and merges the overrides', async () => {
    const spy = mockResponses([{ status: 200, body: { data: { data: [], hasMore: false }, errors: [] } }]);
    await run({ action: runReportAction, propsValue: {
      payload: JSON.stringify(PAYLOAD),
      start_time: '2026-11-01T00:00:00.000Z',
      end_time: '2026-11-08T00:00:00.000Z',
      page: 2,
      page_size: 200,
    } });
    expect(requests(spy)[0].body).toEqual({
      ...PAYLOAD,
      startTime: Date.parse('2026-11-01T00:00:00.000Z'),
      endTime: Date.parse('2026-11-08T00:00:00.000Z'),
      page: 2,
      pageSize: 200,
      jsonResponse: true,
    });
  });

  it('caps the page size at 1,000, from the override or the payload', async () => {
    const spy = mockResponses([
      { status: 200, body: { data: { data: [] }, errors: [] } },
      { status: 200, body: { data: { data: [] }, errors: [] } },
    ]);
    await run({ action: runReportAction, propsValue: { payload: PAYLOAD, page_size: 5000 } });
    await run({ action: runReportAction, propsValue: { payload: { ...PAYLOAD, pageSize: 2500 } } });
    const [first, second] = requests(spy);
    expect(shape.record(first.body)['pageSize']).toBe(1000);
    expect(shape.record(second.body)['pageSize']).toBe(1000);
  });

  it.each([
    ['not JSON', '{"report": ', 'Report Payload is not valid JSON'],
    ['empty', '   ', 'Report Payload is empty'],
    ['an array', '[1, 2]', 'Report Payload must be a JSON object'],
  ])('gives a clear error when the payload is %s', async (_name, payload, message) => {
    const spy = mockResponses([]);
    await expect(run({ action: runReportAction, propsValue: { payload } })).rejects.toThrow(message);
    expect(spy).not.toHaveBeenCalled();
  });

  it('turns headings and row arrays into objects', async () => {
    mockResponses([{ status: 200, body: { data: { headings: ['Queue', 'Cases'], rows: [['A', 3], ['B', 4]], hasMore: false }, errors: [] } }]);
    expect(await run({ action: runReportAction, propsValue: { payload: PAYLOAD } })).toEqual({
      rowCount: 2,
      hasMore: false,
      rows: [
        { Queue: 'A', Cases: 3 },
        { Queue: 'B', Cases: 4 },
      ],
    });
  });

  it('surfaces errors returned with a 200 and no data', async () => {
    mockResponses([{ status: 200, body: { data: {}, errors: [{ id: '1', code: 'BAD', message: 'report.not.found' }], metadata: {} } }]);
    await expect(run({ action: runReportAction, propsValue: { payload: PAYLOAD } })).rejects.toThrow('report.not.found');
  });
});
