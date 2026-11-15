import { HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { findProfileAction } from '../../src/lib/actions/find-profile';
import { getCaseAction } from '../../src/lib/actions/get-case';
import { runReportAction } from '../../src/lib/actions/run-report';
import { searchCasesAction } from '../../src/lib/actions/search-cases';
import { SprinklrCaseOutput } from '../../src/lib/common/case';
import { sprinklrTiming } from '../../src/lib/common/client';
import { sprinklrErrors } from '../../src/lib/common/errors';
import { describeMock, MOCK_AUTH, routeToSprinklrMock, SPRINKLR_MOCK_BASE_URL } from '../support/sprinklr-mock';

type RunnableAction = { run: (ctx: never) => Promise<unknown> };

function run(action: RunnableAction, propsValue: Record<string, unknown>): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  return action.run({ ...base, auth: MOCK_AUTH, propsValue } as never);
}

describeMock('read actions against the Sprinklr public mock', () => {
  beforeEach(() => {
    vi.spyOn(sprinklrTiming, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Get Case calls GET /case?caseNumber= and parses the schema-shaped case', async () => {
    const { requests } = routeToSprinklrMock();
    const out = (await run(getCaseAction, { find_by: 'case_number', value: '123' })) as SprinklrCaseOutput;
    expect(requests.map((r) => [r.method, r.url])).toEqual([[HttpMethod.GET, `${SPRINKLR_MOCK_BASE_URL}/case?caseNumber=123`]]);
    expect(requests[0].headers).toMatchObject({ Authorization: 'Bearer mock-token', Key: 'mock-key' });
    expect(typeof out.id).toBe('string');
    expect(typeof out.caseNumber).toBe('number');
    expect(typeof out.createdTime).toBe('number');
    expect(typeof out.deleted).toBe('boolean');
    expect(out.contact).not.toBeNull();
    expect(out.workflow).not.toBeNull();
  });

  it('Find Profile by ID calls GET /profile?id= and returns found: true', async () => {
    const { requests } = routeToSprinklrMock();
    const out = (await run(findProfileAction, { find_by: 'profile_id', value: '123' })) as { found: boolean; profiles: unknown[] };
    expect(requests.map((r) => [r.method, r.url])).toEqual([[HttpMethod.GET, `${SPRINKLR_MOCK_BASE_URL}/profile?id=123`]]);
    expect(out.found).toBe(true);
    expect(Array.isArray(out.profiles)).toBe(true);
  });

  it('Search Cases calls POST /search/case and follows the cursor with GET', async () => {
    const { requests } = routeToSprinklrMock();
    const out = (await run(searchCasesAction, { keyword: 'refund', max_results: 2 })) as { count: number; cases: SprinklrCaseOutput[] };
    expect(requests[0].method).toBe(HttpMethod.POST);
    expect(requests[0].url).toBe(`${SPRINKLR_MOCK_BASE_URL}/search/case`);
    expect(requests.slice(1).every((r) => r.method === HttpMethod.GET && r.url.startsWith(`${SPRINKLR_MOCK_BASE_URL}/search/case?id=`))).toBe(true);
    expect(out.count).toBeLessThanOrEqual(2);
    expect(out.cases.length).toBe(out.count);
  });

  it('Run Report calls POST /reports/query and surfaces the mock errors', async () => {
    const { requests } = routeToSprinklrMock();
    await expect(run(runReportAction, { payload: { reportingEngine: 'PLATFORM', report: 'CASE', pageSize: 10 } })).rejects.toThrow(
      'Sprinklr returned an error for POST /reports/query',
    );
    expect(requests.map((r) => [r.method, r.url])).toEqual([[HttpMethod.POST, `${SPRINKLR_MOCK_BASE_URL}/reports/query`]]);
    expect(requests[0].body).toMatchObject({ jsonResponse: true });
  });

  it('a call with no headers gets a 401 that becomes the reconnect message', async () => {
    routeToSprinklrMock({ stripHeaders: true });
    await expect(run(getCaseAction, { find_by: 'case_number', value: '123' })).rejects.toThrow(sprinklrErrors.MESSAGES.RECONNECT);
  });
});
