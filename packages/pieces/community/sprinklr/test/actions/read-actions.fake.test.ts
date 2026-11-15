import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findProfileAction } from '../../src/lib/actions/find-profile';
import { getCaseAction } from '../../src/lib/actions/get-case';
import { runReportAction } from '../../src/lib/actions/run-report';
import { searchCasesAction } from '../../src/lib/actions/search-cases';
import { sprinklrTiming } from '../../src/lib/common/client';
import { FAKE_SPRINKLR_CLIENT, FakeSprinklr, FakeSprinklrOptions, startFakeSprinklr } from '../support/fake-sprinklr';
import { pieceRunner, RunnableAction, shape } from '../support/piece-runner';

const T0 = 1_780_000_000_000;
const MINUTE = 60_000;

const VARIANTS: Array<{ name: string; options: FakeSprinklrOptions }> = [
  { name: 'wrapped envelope, no segment', options: { envelope: 'wrapped' } },
  { name: 'bare envelope, no segment', options: { envelope: 'bare' } },
  { name: 'wrapped envelope, prod2', options: { envelope: 'wrapped', segment: 'prod2' } },
  { name: 'bare envelope, prod2', options: { envelope: 'bare', segment: 'prod2' } },
];

describe.each(VARIANTS)('read actions against the fake ($name)', ({ options }) => {
  let fake: FakeSprinklr;
  let auth: { access_token: string; client_id: string; props: Record<string, unknown> };

  function run({ action, propsValue }: { action: RunnableAction; propsValue: Record<string, unknown> }): Promise<unknown> {
    return pieceRunner.runAction({ action, auth, propsValue });
  }

  beforeEach(async () => {
    vi.spyOn(sprinklrTiming, 'sleep').mockResolvedValue(undefined);
    fake = await startFakeSprinklr({ ...options, now: () => T0 });
    auth = {
      access_token: fake.control.issueToken().accessToken,
      client_id: FAKE_SPRINKLR_CLIENT.apiKey,
      props: { base: fake.baseUrl, callback: FAKE_SPRINKLR_CLIENT.redirectUris[0] },
    };
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fake.close();
  });

  it('Get Case finds a case by number and by ID', async () => {
    const [, second] = fake.control.seedCases(3);
    const byNumber = shape.record(await run({ action: getCaseAction, propsValue: { find_by: 'case_number', value: String(second.caseNumber) } }));
    expect(byNumber['id']).toBe(second.id);
    expect(byNumber['caseNumber']).toBe(second.caseNumber);
    expect(byNumber['subject']).toBe(`#${second.caseNumber} Email Seeded case 2`);
    expect(byNumber['contact']).toEqual({
      id: 'EMAIL_customer2@example.com',
      name: 'Customer 2',
      channelType: 'EMAIL',
      channelId: 'customer2@example.com',
    });
    expect(byNumber['createdTime']).toBe(T0 - MINUTE);
    const byId = await run({ action: getCaseAction, propsValue: { find_by: 'case_id', value: second.id } });
    expect(byId).toEqual(byNumber);
  });

  it('Get Case gives a clear error when no case matches', async () => {
    fake.control.seedCases(1);
    await expect(run({ action: getCaseAction, propsValue: { find_by: 'case_number', value: '999' } })).rejects.toThrow(
      'No Sprinklr case has number 999. Check the case number.',
    );
  });

  it('Search Cases filters by keyword, dates and queue', async () => {
    fake.control.seedCases(6, (i, seeded) => ({
      subject: i % 2 === 0 ? `Refund request ${i}` : `Question ${i}`,
      workflow: { ...seeded.workflow, queues: i < 3 ? [{ queueId: 5001, assignmentTime: T0 }] : [] },
    }));
    const out = shape.record(await run({ action: searchCasesAction, propsValue: {
      keyword: 'refund',
      created_after: new Date(T0 - 4.5 * MINUTE).toISOString(),
      created_before: new Date(T0 - 0.5 * MINUTE).toISOString(),
    } }));
    expect(shape.list(out['cases']).map((c) => shape.record(c)['subject'])).toEqual(['Refund request 4', 'Refund request 2']);
    const inQueue = shape.list(shape.record(await run({ action: searchCasesAction, propsValue: { keyword: 'refund', queue_id: '5001' } }))['cases']).map((c) => shape.record(c));
    expect(inQueue.map((c) => c['subject'])).toEqual(['Refund request 2', 'Refund request 0']);
    expect(shape.record(inQueue[0]['workflow'])['queues']).toEqual([{ queueId: '5001', assignmentTime: T0 }]);
  });

  it('Search Cases pages over more than one page, newest first', async () => {
    fake.control.seedCases(150);
    const requestsBefore = fake.state.requests.length;
    const out = shape.record(await run({ action: searchCasesAction, propsValue: { max_results: 120 } }));
    const cases = shape.list(out['cases']).map((c) => shape.record(c));
    const searchCalls = fake.state.requests.slice(requestsBefore).filter((r) => r.path.includes('/search/case'));
    expect(searchCalls.map((r) => r.method)).toEqual(['POST', 'GET']);
    expect(out['count']).toBe(120);
    expect(out['totalCount']).toBe(150);
    expect(new Set(cases.map((c) => c['id'])).size).toBe(120);
    const times = cases.map((c) => Number(c['createdTime'] ?? 0));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it('Find Profile finds by email, channel and ID, and reports a miss', async () => {
    fake.control.seedCases(2);
    const byEmail = shape.record(await run({ action: findProfileAction, propsValue: { find_by: 'email', value: 'customer2@example.com' } }));
    expect(byEmail).toMatchObject({
      found: true,
      contact: { fullName: 'Customer 2', email: 'customer2@example.com' },
      profiles: [{ channelType: 'EMAIL', channelId: 'customer2@example.com' }],
    });
    const byChannel = await run({ action: findProfileAction, propsValue: { find_by: 'channel_id', channel_type: 'EMAIL', value: 'customer2@example.com' } });
    expect(byChannel).toEqual(byEmail);
    const byId = await run({ action: findProfileAction, propsValue: { find_by: 'profile_id', value: byEmail['id'] } });
    expect(byId).toEqual(byEmail);
    const miss = shape.record(await run({ action: findProfileAction, propsValue: { find_by: 'email', value: 'nobody@example.com' } }));
    expect(miss['found']).toBe(false);
  });

  it('Run Report returns rows as objects with paging overrides', async () => {
    fake.state.reportRowCount = 5;
    const payload = {
      reportingEngine: 'PLATFORM',
      report: 'CASE',
      groupBys: [{ heading: 'Queue' }],
      projections: [{ heading: 'Cases' }],
    };
    const out = await run({ action: runReportAction, propsValue: { payload: JSON.stringify(payload), page: 0, page_size: 2 } });
    expect(out).toEqual({
      rowCount: 2,
      hasMore: true,
      rows: [
        { Queue: 'Queue 1', Cases: 10 },
        { Queue: 'Queue 2', Cases: 20 },
      ],
    });
    const last = await run({ action: runReportAction, propsValue: { payload, page: 2, page_size: 2 } });
    expect(last).toEqual({ rowCount: 1, hasMore: false, rows: [{ Queue: 'Queue 5', Cases: 50 }] });
  });
});
