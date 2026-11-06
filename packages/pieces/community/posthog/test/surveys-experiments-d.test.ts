import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostHogApiError } from '../src/lib/common/client';
import { listSurveys } from '../src/lib/actions/ai/list-surveys';
import { getSurvey } from '../src/lib/actions/ai/get-survey';
import { getSurveyStats } from '../src/lib/actions/ai/get-survey-stats';
import { listExperiments } from '../src/lib/actions/ai/list-experiments';
import { getExperimentResults } from '../src/lib/actions/ai/get-experiment-results';
import { listGroups } from '../src/lib/actions/ai/list-groups';
import { listSessionRecordings } from '../src/lib/actions/ai/list-session-recordings';

const auth = { props: { personal_api_key: 'phx_secret', project_id: '123', api_host: 'https://eu.posthog.com', ingestion_host: '' } };
const SID = '01a14f1e-eb6f-0000-f58b-75b08365e52e';
const all = [listSurveys, getSurvey, getSurveyStats, listExperiments, getExperimentResults, listGroups, listSessionRecordings];

function run({ action, propsValue = {} }: { action: { run: unknown }; propsValue?: Record<string, unknown> }) {
  const fn = action.run;
  if (typeof fn !== 'function') throw new Error('no run');
  return Reflect.apply(fn, undefined, [{ auth, propsValue }]);
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) {
    if (b instanceof Error) spy.mockRejectedValueOnce(b);
    else spy.mockResolvedValueOnce({ status: 200, headers: {}, body: b });
  }
  return spy;
}

function notFound() {
  return Object.assign(new Error('http'), { response: { status: 404, body: { type: 'invalid_request', code: 'not_found', detail: 'Not found.' }, headers: {} } });
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  it('all are ai actions with outputSchema and no dropdowns', () => {
    for (const a of all) {
      expect(a.audience, a.name).toBe('ai');
      expect(a.outputSchema, a.name).toBeDefined();
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
      for (const p of Object.values(a.props)) expect(Reflect.get(p, 'type')).not.toBe('DROPDOWN');
    }
  });
});

describe('surveys', () => {
  it('lists with paging and derived status', async () => {
    const spy = mockSeq({ next: 'https://eu.posthog.com/api/projects/123/surveys/?offset=2', results: [
      { id: SID, name: 'NPS', type: 'popover', questions: [{}, {}], start_date: '2026-10-01T00:00:00Z', end_date: null },
      { id: 'x', name: 'Old', archived: true, questions: [] },
    ] });
    const out = await run({ action: listSurveys, propsValue: { limit: 2, search: ' nps ' } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://eu.posthog.com/api/projects/123/surveys/');
    expect(req.queryParams).toEqual({ limit: '2', offset: '0', search: 'nps' });
    expect(out.items[0]).toMatchObject({ id: SID, status: 'running', questionCount: 2 });
    expect(out.items[1].status).toBe('archived');
    expect(out).toMatchObject({ count: 2, hasMore: true, nextOffset: 2 });
  });
  it('lists empty', async () => {
    mockSeq({ count: 0, next: null, results: [] });
    expect(await run({ action: listSurveys })).toEqual({ items: [], count: 0, hasMore: false, nextOffset: null });
  });
  it('gets one survey with questions', async () => {
    const spy = mockSeq({ id: SID, name: 'NPS', type: 'api', questions: [{ id: 'q1', type: 'single_choice', question: 'Pick', choices: ['a', 'b'] }], linked_flag: { key: 'f' }, created_by: { email: 'a@b.co' } });
    const out = await run({ action: getSurvey, propsValue: { surveyId: SID.toUpperCase() } });
    expect(spy.mock.calls[0][0].url).toBe(`https://eu.posthog.com/api/projects/123/surveys/${SID}/`);
    expect(out).toMatchObject({ status: 'draft', linkedFlagKey: 'f', createdBy: 'a@b.co', questions: [{ id: 'q1', choices: ['a', 'b'] }] });
  });
  it('rejects a non-UUID survey id before calling', async () => {
    const spy = mockSeq();
    await expect(run({ action: getSurvey, propsValue: { surveyId: '../x' } })).rejects.toThrow('UUID');
    expect(spy).not.toHaveBeenCalled();
  });
  it('maps 404 to a PostHogApiError', async () => {
    mockSeq(notFound());
    const err: unknown = await run({ action: getSurvey, propsValue: { surveyId: SID } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PostHogApiError);
    expect(err instanceof Error ? err.message : '').toContain('(404)');
  });
  it('returns stats and passes the date window', async () => {
    const spy = mockSeq({
      survey_id: SID,
      stats: { 'survey shown': { total_count: 10, unique_persons: 8 }, 'survey sent': { total_count: 4, unique_persons: 4, last_seen: '2026-10-02T00:00:00Z' }, 'survey dismissed': {} },
      rates: { response_rate: 40, dismissal_rate: 0, unique_users_response_rate: 50, unique_users_dismissal_rate: 0 },
      start_date: null, end_date: null,
    });
    const out = await run({ action: getSurveyStats, propsValue: { surveyId: SID, dateFrom: '2026-10-01' } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe(`https://eu.posthog.com/api/projects/123/surveys/${SID}/stats/`);
    expect(req.queryParams).toEqual({ date_from: '2026-10-01T00:00:00.000Z' });
    expect(out).toMatchObject({ shown: { total: 10, uniquePersons: 8 }, sent: { total: 4, lastSeen: '2026-10-02T00:00:00Z' }, dismissed: { total: 0 }, responseRate: 40, dateFrom: '2026-10-01T00:00:00.000Z' });
  });
});

describe('experiments', () => {
  it('lists', async () => {
    mockSeq({ next: null, results: [{ id: 7, name: 'Exp', status: 'draft', feature_flag_key: 'k', metrics: [{}] }] });
    const out = await run({ action: listExperiments });
    expect(out.items[0]).toMatchObject({ id: 7, status: 'draft', featureFlagKey: 'k', metricCount: 1 });
  });
  it('computes results for at most 5 metrics and keeps per-metric errors', async () => {
    const metrics = Array.from({ length: 6 }, (_, i) => ({ uuid: `m${i}`, name: `M${i}`, metric_type: 'mean', kind: 'ExperimentMetric' }));
    const result = { baseline: { key: 'control', number_of_samples: 100, sum: 10 }, variant_results: [{ key: 'test', number_of_samples: 90, sum: 12, chance_to_win: 0.8, significant: false, credible_interval: [-0.1, 0.3], validation_failures: [] }] };
    const failure = Object.assign(new Error('http'), { response: { status: 400, body: { detail: 'bad metric' }, headers: {} } });
    const spy = mockSeq({ id: 7, name: 'Exp', status: 'running', metrics }, result, failure, result, result, result);
    const out = await run({ action: getExperimentResults, propsValue: { experimentId: '7' } });
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy.mock.calls[1][0].body).toEqual({ query: { kind: 'ExperimentQuery', experiment_id: 7, metric: metrics[0] }, name: 'activepieces' });
    expect(out.metrics).toHaveLength(5);
    expect(out.metrics[0]).toMatchObject({ uuid: 'm0', error: null, control: { key: 'control', samples: 100 }, variants: [{ key: 'test', chanceToWin: 0.8, credibleInterval: [-0.1, 0.3] }] });
    expect(out.metrics[1].error).toContain('bad metric');
    expect(out).toMatchObject({ totalMetrics: 6, truncated: true });
  });
  it('experiment without metrics makes one call', async () => {
    const spy = mockSeq({ id: 7, metrics: [] });
    expect(await run({ action: getExperimentResults, propsValue: { experimentId: 7 } })).toMatchObject({ metrics: [], truncated: false });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('rejects non-numeric id', async () => {
    await expect(run({ action: getExperimentResults, propsValue: { experimentId: 'abc' } })).rejects.toThrow('numeric');
  });
});

describe('groups', () => {
  it('lists with search and returns the cursor from next', async () => {
    const spy = mockSeq({ next: 'https://eu.posthog.com/api/projects/123/groups/?cursor=abc%3D&group_type_index=0', results: [{ group_key: 'acme', group_type_index: 0, group_properties: { name: 'Acme' }, created_at: 't' }] });
    const out = await run({ action: listGroups, propsValue: { groupTypeIndex: 0, search: 'ac', cursor: 'prev' } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ group_type_index: '0', search: 'ac', cursor: 'prev' });
    expect(out).toEqual({ items: [{ groupKey: 'acme', groupTypeIndex: 0, properties: { name: 'Acme' }, createdAt: 't' }], count: 1, hasMore: true, nextCursor: 'abc=' });
  });
  it('requires a valid group type index', async () => {
    await expect(run({ action: listGroups, propsValue: {} })).rejects.toThrow('required');
    await expect(run({ action: listGroups, propsValue: { groupTypeIndex: 5 } })).rejects.toThrow('0 to 4');
  });
});

describe('session recordings', () => {
  it('lists minimal fields filtered by person', async () => {
    const pid = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';
    const spy = mockSeq({ has_next: true, results: [{ id: 's1', distinct_id: 'd', person: { uuid: pid, properties: { email: 'a@b.co' } }, recording_duration: 30, click_count: 2, start_url: 'https://x', snapshot_data: 'huge' }] });
    const out = await run({ action: listSessionRecordings, propsValue: { personId: pid, dateFrom: '-7d', limit: 1 } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ limit: '1', offset: '0', person_uuid: pid, date_from: '-7d' });
    expect(out.items[0]).toEqual({ id: 's1', distinctId: 'd', personId: pid, personEmail: 'a@b.co', startTime: null, endTime: null, durationSeconds: 30, activeSeconds: null, clickCount: 2, startUrl: 'https://x', viewed: false });
    expect(out).toMatchObject({ hasMore: true, nextOffset: 1 });
  });
  it('rejects bad dates and limits', async () => {
    await expect(run({ action: listSessionRecordings, propsValue: { dateFrom: 'yesterday' } })).rejects.toThrow('ISO 8601');
    await expect(run({ action: listSessionRecordings, propsValue: { limit: 500 } })).rejects.toThrow('1 to 50');
  });
});
