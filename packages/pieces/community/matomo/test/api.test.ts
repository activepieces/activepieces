import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, InputPropertyMap, StaticPropsValue } from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { matomo } from '../src';
import { matomoApi } from '../src/lib/api';
import { matomoAuth } from '../src/lib/auth';
import { addAnnotationAction } from '../src/lib/actions/add-annotation';
import { createAnnotationAction } from '../src/lib/actions/create-annotation';
import { listAnnotationsAction } from '../src/lib/actions/list-annotations';
import { deleteAnnotationAction } from '../src/lib/actions/delete-annotation';
import { listSitesAction } from '../src/lib/actions/list-sites';
import { getVisitsSummaryAction } from '../src/lib/actions/get-visits-summary';
import { getTopPagesAction } from '../src/lib/actions/get-top-pages';
import { getReferrersAction } from '../src/lib/actions/get-referrers';
import { listGoalsAction } from '../src/lib/actions/list-goals';
import { getGoalConversionsAction } from '../src/lib/actions/get-goal-conversions';
import { getRecentVisitsAction } from '../src/lib/actions/get-recent-visits';
import { trackEventAction } from '../src/lib/actions/track-event';

const authProps = { domain: 'https://matomo.example.com/', tokenAuth: 'abc123', siteId: '1' };
const auth = { type: AppConnectionType.CUSTOM_AUTH, props: authProps };

afterEach(() => {
  vi.restoreAllMocks();
});

function context<Props extends InputPropertyMap>({ propsValue }: { propsValue: StaticPropsValue<Props> }) {
  return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function mockMatomo({ body }: { body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function lastRequest({ spy }: { spy: ReturnType<typeof mockMatomo> }) {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}

function formOf({ spy }: { spy: ReturnType<typeof mockMatomo> }) {
  return Object.fromEntries(new URLSearchParams(String(lastRequest({ spy }).body)));
}

function expectApiCall({ spy, method, params }: { spy: ReturnType<typeof mockMatomo>; method: string; params: Record<string, string> }) {
  const request = lastRequest({ spy });
  expect(request.method).toBe(HttpMethod.POST);
  expect(request.url).toBe('https://matomo.example.com/index.php');
  expect(request.queryParams).toBeUndefined();
  expect(request.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' });
  expect(typeof request.body).toBe('string');
  expect(String(request.body)).toContain('token_auth=abc123');
  expect(formOf({ spy })).toMatchObject({ module: 'API', format: 'JSON', method, token_auth: 'abc123', ...params });
  expect(request.redactBodyInErrors).toBe(true);
}

describe('piece', () => {
  it('registers every action and the trigger', () => {
    expect(Object.keys(matomo.actions()).sort()).toEqual(
      [
        'add_annotation',
        'create_annotation',
        'custom_api_call',
        'delete_annotation',
        'get_goal_conversions',
        'get_recent_visits',
        'get_referrers',
        'get_top_pages',
        'get_visits_summary',
        'list_annotations',
        'list_goals',
        'list_sites',
        'track_event',
      ].sort(),
    );
    expect(Object.keys(matomo.triggers())).toEqual(['new_visit']);
  });
});

describe('matomoApi', () => {
  it('normalises the domain', () => {
    expect(matomoApi.normaliseDomain('matomo.example.com/')).toBe('https://matomo.example.com');
    expect(matomoApi.normaliseDomain('http://localhost:8081/index.php')).toBe('http://localhost:8081');
    expect(matomoApi.normaliseDomain('https://x.example.com/analytics//')).toBe('https://x.example.com/analytics');
  });

  it('maps a Matomo error result to a readable message', async () => {
    mockMatomo({ body: { result: 'error', message: 'Invalid date' } });
    await expect(matomoApi.call({ auth: authProps, method: 'Annotations.add' })).rejects.toThrow('Matomo Annotations.add failed: Invalid date');
  });

  it('maps an HTTP error to a readable message and warns the write may have applied', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError('[redacted]', { status: 500, responseBody: { message: 'boom' } }));
    await expect(matomoApi.call({ auth: authProps, method: 'Annotations.add' })).rejects.toThrow(
      'Matomo Annotations.add failed: HTTP 500: boom. The change may still have been applied.',
    );
  });

  it('maps a transport error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(matomoApi.call({ auth: authProps, method: 'VisitsSummary.get' })).rejects.toThrow('Matomo VisitsSummary.get failed: could not reach the Matomo server at https://matomo.example.com.');
  });

  it('maps an unreachable server to a clear message', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new TypeError('fetch failed'));
    await expect(matomoApi.call({ auth: { ...authProps, domain: 'http://localhost:9/' }, method: 'SitesManager.getSiteFromId' })).rejects.toThrow(
      'Matomo SitesManager.getSiteFromId failed: could not reach the Matomo server at http://localhost:9.',
    );
  });

  it('validate rejects a domain without a scheme', async () => {
    const spy = mockMatomo({ body: {} });
    const result = await matomoAuth.validate?.({ auth: { domain: 'localhost:8081', tokenAuth: 'abc123', siteId: '1' }, server: { apiAddress: '', publicUrl: '' } });
    expect(result).toEqual({ valid: false, error: 'Matomo Domain must start with http:// or https://' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects a non-JSON response', async () => {
    mockMatomo({ body: '<html></html>' });
    await expect(matomoApi.call({ auth: authProps, method: 'VisitsSummary.get' })).rejects.toThrow('did not return JSON');
  });
});

describe('action requests', () => {
  it('Add Annotation sends only the date part and starred=0 by default', async () => {
    const spy = mockMatomo({ body: { idNote: 3, date: '2026-11-18', note: 'Deploy', starred: 0 } });
    const result = await addAnnotationAction.run(
      context<typeof addAnnotationAction.props>({ propsValue: { note: 'Deploy', date: '2026-11-18T00:00:00.000Z', starred: undefined, siteId: undefined } }),
    );
    expectApiCall({ spy, method: 'Annotations.add', params: { idSite: '1', note: 'Deploy', date: '2026-11-18', starred: '0' } });
    expect(result).toEqual({ idNote: 3, idsite: null, date: '2026-11-18', note: 'Deploy', starred: false, user: null, canEditOrDelete: null });
  });

  it('Create Annotation sends the chosen site and starred=1', async () => {
    const spy = mockMatomo({ body: {} });
    await createAnnotationAction.run(
      context<typeof createAnnotationAction.props>({ propsValue: { note: 'Launch', date: '2026-11-01', starred: 'yes', siteId: '2' } }),
    );
    expectApiCall({ spy, method: 'Annotations.add', params: { idSite: '2', note: 'Launch', date: '2026-11-01', starred: '1' } });
  });

  it('Create Annotation rejects a non YYYY-MM-DD date', async () => {
    mockMatomo({ body: {} });
    await expect(
      createAnnotationAction.run(context<typeof createAnnotationAction.props>({ propsValue: { note: 'x', date: '18/11/2026', starred: undefined, siteId: undefined } })),
    ).rejects.toThrow('YYYY-MM-DD');
  });

  it('List Annotations flattens notes keyed by site', async () => {
    const spy = mockMatomo({ body: { '1': [{ idNote: 1 }, { idNote: 2 }] } });
    const result = await listAnnotationsAction.run(
      context<typeof listAnnotationsAction.props>({ propsValue: { siteId: undefined, period: 'range', date: 'last30' } }),
    );
    expectApiCall({ spy, method: 'Annotations.getAll', params: { idSite: '1', period: 'range', date: 'last30' } });
    expect(result.annotations.map((a) => a.idNote)).toEqual([1, 2]);
    expect(result.count).toBe(2);
  });

  it('List Annotations flattens the nested per-site per-period shape', async () => {
    const note = { id: 1, idsite: 1, date: '2026-11-18', note: 'seed', starred: 0, user: 'u', canEditOrDelete: true, idNote: 1 };
    mockMatomo({ body: { '1': [[note], [{ ...note, id: 2, idNote: 2 }]] } });
    const result = await listAnnotationsAction.run(
      context<typeof listAnnotationsAction.props>({ propsValue: { siteId: undefined, period: 'day', date: 'today' } }),
    );
    expect(result.count).toBe(2);
    expect(result.annotations[0]).toEqual({ idNote: 1, idsite: 1, date: '2026-11-18', note: 'seed', starred: false, user: 'u', canEditOrDelete: true });
    expect(result.annotations[0]).not.toHaveProperty('id');
    expect(result.annotations[1].idNote).toBe(2);
  });

  it('Create Annotation returns starred as a boolean', async () => {
    mockMatomo({ body: { idNote: 9, date: '2026-11-01', note: 'Launch', starred: '1' } });
    const result = await createAnnotationAction.run(
      context<typeof createAnnotationAction.props>({ propsValue: { note: 'Launch', date: '2026-11-01', starred: 'yes', siteId: undefined } }),
    );
    expect(result.starred).toBe(true);
  });

  it('Get Recent Visits adds ISO time twins for Unix timestamps', async () => {
    mockMatomo({ body: [{ idVisit: 1, serverTimestamp: 1763452800, firstActionTimestamp: 1763452800, lastActionTimestamp: 1763452860, actionDetails: [{ timestamp: 1763452800 }] }] });
    const result = await getRecentVisitsAction.run(context<typeof getRecentVisitsAction.props>({ propsValue: { siteId: undefined, limit: 1 } }));
    expect(result.visits[0]).toMatchObject({
      first_action_time: '2025-11-18T08:00:00.000Z',
      last_action_time: '2025-11-18T08:01:00.000Z',
      actionDetails: [{ timestamp: 1763452800, time: '2025-11-18T08:00:00.000Z' }],
    });
  });

  it('report actions list required inputs before the optional site', () => {
    for (const action of [getVisitsSummaryAction, getTopPagesAction, getReferrersAction, getGoalConversionsAction, listAnnotationsAction]) {
      const keys = Object.keys(action.props);
      expect(keys.indexOf('siteId')).toBeGreaterThan(keys.indexOf('date'));
    }
  });

  it('Goal dropdown lists goals of the chosen site', async () => {
    const spy = mockMatomo({ body: [{ idgoal: '2', name: 'Signup' }] });
    const result = await getGoalConversionsAction.props.goalId.options({ auth, siteId: '3' }, { searchValue: undefined, server: { apiAddress: '', publicUrl: '' } });
    expect(result.options).toEqual([{ label: 'Signup', value: 2 }]);
    expect(formOf({ spy })).toMatchObject({ method: 'Goals.getGoals', idSite: '3' });
  });

  it('Annotation dropdown lists the last year of annotations as date — note', async () => {
    const spy = mockMatomo({ body: { '1': [[{ idNote: 4, date: '2026-11-18', note: 'Deploy' }]] } });
    const result = await deleteAnnotationAction.props.idNote.options({ auth, siteId: undefined }, { searchValue: undefined, server: { apiAddress: '', publicUrl: '' } });
    expect(result.options).toEqual([{ label: '2026-11-18 — Deploy', value: 4 }]);
    expect(formOf({ spy })).toMatchObject({ method: 'Annotations.getAll', idSite: '1', period: 'range', date: 'last365' });
  });

  it('Limits fall back to the default when not a finite number', async () => {
    const spy = mockMatomo({ body: [] });
    await getRecentVisitsAction.run(context<typeof getRecentVisitsAction.props>({ propsValue: { siteId: undefined, limit: Number.NaN } }));
    expect(formOf({ spy })).toMatchObject({ filter_limit: '10' });
    await getTopPagesAction.run(context<typeof getTopPagesAction.props>({ propsValue: { siteId: undefined, period: 'day', date: 'today', limit: Number.NaN } }));
    expect(formOf({ spy })).toMatchObject({ filter_limit: '10' });
  });

  it('Delete Annotation sends idNote', async () => {
    const spy = mockMatomo({ body: { result: 'success' } });
    const result = await deleteAnnotationAction.run(context<typeof deleteAnnotationAction.props>({ propsValue: { idNote: 7, siteId: undefined } }));
    expectApiCall({ spy, method: 'Annotations.delete', params: { idSite: '1', idNote: '7' } });
    expect(result).toEqual({ deleted: true, idNote: 7 });
  });

  it('List Sites sends no idSite', async () => {
    const spy = mockMatomo({ body: [{ idsite: '1', name: 'Demo', main_url: 'https://demo.test', timezone: 'UTC', currency: 'USD', ts_created: 'x' }] });
    const result = await listSitesAction.run(context<typeof listSitesAction.props>({ propsValue: {} }));
    expectApiCall({ spy, method: 'SitesManager.getSitesWithAtLeastViewAccess', params: {} });
    expect(formOf({ spy })).not.toHaveProperty('idSite');
    expect(result.count).toBe(1);
  });

  it('Get Visits Summary sends period and date and fills zeros', async () => {
    const spy = mockMatomo({ body: [] });
    const result = await getVisitsSummaryAction.run(
      context<typeof getVisitsSummaryAction.props>({ propsValue: { siteId: undefined, period: 'month', date: '2026-11-01' } }),
    );
    expectApiCall({ spy, method: 'VisitsSummary.get', params: { idSite: '1', period: 'month', date: '2026-11-01' } });
    expect(result.nb_visits).toBe(0);
  });

  it('Get Visits Summary rejects lastN with a single-day period', async () => {
    mockMatomo({ body: {} });
    await expect(
      getVisitsSummaryAction.run(context<typeof getVisitsSummaryAction.props>({ propsValue: { siteId: undefined, period: 'day', date: 'last7' } })),
    ).rejects.toThrow('Date Range');
  });

  it('Get Top Pages sends flat=1 and the clamped limit', async () => {
    const spy = mockMatomo({ body: [{ label: '/a', nb_hits: 3 }] });
    const result = await getTopPagesAction.run(
      context<typeof getTopPagesAction.props>({ propsValue: { siteId: undefined, period: 'day', date: 'today', limit: 9999 } }),
    );
    expectApiCall({ spy, method: 'Actions.getPageUrls', params: { period: 'day', date: 'today', flat: '1', filter_limit: '500' } });
    expect(result.pages[0].nb_hits).toBe(3);
  });

  it('Get Traffic Sources calls Referrers.getReferrerType', async () => {
    const spy = mockMatomo({ body: [{ label: 'Search Engines', nb_visits: 4 }] });
    await getReferrersAction.run(context<typeof getReferrersAction.props>({ propsValue: { siteId: undefined, period: 'week', date: 'yesterday' } }));
    expectApiCall({ spy, method: 'Referrers.getReferrerType', params: { period: 'week', date: 'yesterday' } });
  });

  it('List Goals calls Goals.getGoals', async () => {
    const spy = mockMatomo({ body: { '1': { idgoal: '1', name: 'Signup' } } });
    const result = await listGoalsAction.run(context<typeof listGoalsAction.props>({ propsValue: { siteId: '3' } }));
    expectApiCall({ spy, method: 'Goals.getGoals', params: { idSite: '3' } });
    expect(result.goals[0].name).toBe('Signup');
  });

  it('Get Goal Conversions sends idGoal only when given', async () => {
    const spy = mockMatomo({ body: { nb_conversions: 2 } });
    await getGoalConversionsAction.run(
      context<typeof getGoalConversionsAction.props>({ propsValue: { siteId: undefined, goalId: 4, period: 'day', date: 'today' } }),
    );
    expectApiCall({ spy, method: 'Goals.get', params: { idGoal: '4' } });
    await getGoalConversionsAction.run(
      context<typeof getGoalConversionsAction.props>({ propsValue: { siteId: undefined, goalId: undefined, period: 'day', date: 'today' } }),
    );
    expect(formOf({ spy })).not.toHaveProperty('idGoal');
  });

  it('Get Recent Visits sends filter_limit and no period', async () => {
    const spy = mockMatomo({ body: [{ idVisit: 1 }] });
    await getRecentVisitsAction.run(context<typeof getRecentVisitsAction.props>({ propsValue: { siteId: undefined, limit: 5 } }));
    expectApiCall({ spy, method: 'Live.getLastVisitsDetails', params: { filter_limit: '5' } });
    expect(formOf({ spy })).not.toHaveProperty('period');
  });

  it('Track Event posts to matomo.php with the token in the body', async () => {
    const spy = mockMatomo({ body: '' });
    const result = await trackEventAction.run(
      context<typeof trackEventAction.props>({
        propsValue: {
          category: 'Signup',
          action: 'Submit',
          name: undefined,
          value: 5,
          url: undefined,
          userId: undefined,
          visitorId: 'ABCDEF0123456789',
          siteId: undefined,
        },
      }),
    );
    const request = lastRequest({ spy });
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://matomo.example.com/matomo.php');
    expect(request.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded' });
    expect(request.queryParams).toBeUndefined();
    const body = new URLSearchParams(String(request.body));
    expect(Object.fromEntries(body)).toEqual({
      idsite: '1',
      e_c: 'Signup',
      e_a: 'Submit',
      e_v: '5',
      _id: 'abcdef0123456789',
      apiv: '1',
      send_image: '0',
      bots: '1',
      rec: '1',
      token_auth: 'abc123',
    });
    expect(result).toEqual({ tracked: true, visitorId: 'abcdef0123456789', siteId: '1' });
  });

  it('Track Event returns a null visitorId when a User ID is set', async () => {
    const spy = mockMatomo({ body: '' });
    const result = await trackEventAction.run(
      context<typeof trackEventAction.props>({
        propsValue: { category: 'a', action: 'b', name: undefined, value: undefined, url: undefined, userId: 'user-42', visitorId: undefined, siteId: undefined },
      }),
    );
    expect(new URLSearchParams(String(lastRequest({ spy }).body)).get('uid')).toBe('user-42');
    expect(result.visitorId).toBeNull();
  });

  it('Track Event rejects a bad visitor id', async () => {
    mockMatomo({ body: '' });
    await expect(
      trackEventAction.run(
        context<typeof trackEventAction.props>({
          propsValue: { category: 'a', action: 'b', name: undefined, value: undefined, url: undefined, userId: undefined, visitorId: 'xyz', siteId: undefined },
        }),
      ),
    ).rejects.toThrow('16 hexadecimal');
  });
});
