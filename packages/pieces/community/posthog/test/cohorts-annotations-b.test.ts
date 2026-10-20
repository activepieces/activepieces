import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addPersonsToStaticCohort } from '../src/lib/actions/ai/add-persons-to-static-cohort';
import { createCohort } from '../src/lib/actions/ai/create-cohort';
import { getAnnotation } from '../src/lib/actions/ai/get-annotation';
import { getCohort } from '../src/lib/actions/ai/get-cohort';
import { updateAnnotation } from '../src/lib/actions/ai/update-annotation';

const auth = { props: { personal_api_key: 'phx_secret', project_id: '123', api_host: 'https://eu.posthog.com', ingestion_host: '' } };
const P1 = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';
const P2 = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }) {
  return Reflect.apply(Reflect.get(action, 'run'), undefined, [{ auth, propsValue }]);
}

function mock(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  it.each([getCohort, createCohort, addPersonsToStaticCohort, getAnnotation, updateAnnotation])('$name is ai with schema', (a) => {
    expect(a.audience).toBe('ai');
    expect(a.outputSchema).toBeDefined();
    expect(a.aiMetadata?.description).toBeTruthy();
  });
});

describe('cohorts', () => {
  it('gets a cohort', async () => {
    const spy = mock({ id: 7, name: 'Pro', is_static: false, count: 3, filters: { properties: {} } });
    const out = await run({ action: getCohort, propsValue: { cohortId: ' 7 ' } });
    expect(spy.mock.calls[0][0].url).toBe('https://eu.posthog.com/api/projects/123/cohorts/7/');
    expect(out).toMatchObject({ id: 7, name: 'Pro', isStatic: false, count: 3, url: 'https://eu.posthog.com/project/123/cohorts/7' });
  });
  it('rejects non-numeric cohort id', async () => {
    await expect(run({ action: getCohort, propsValue: { cohortId: 'abc' } })).rejects.toThrow('numeric');
  });
  it('creates a dynamic cohort from properties', async () => {
    const spy = mock({ id: 8, name: 'Pro' });
    await run({ action: createCohort, propsValue: { name: 'Pro', matchProperties: { plan: 'pro', paid: true } } });
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.body).toEqual({
      name: 'Pro',
      description: '',
      is_static: false,
      filters: { properties: { type: 'OR', values: [{ type: 'AND', values: [
        { key: 'plan', value: 'pro', type: 'person', operator: 'exact' },
        { key: 'paid', value: true, type: 'person', operator: 'exact' },
      ] }] } },
    });
  });
  it('creates a static cohort without filters', async () => {
    const spy = mock({ id: 9, is_static: true });
    await run({ action: createCohort, propsValue: { name: 'S', isStatic: true } });
    expect(spy.mock.calls[0][0].body).toEqual({ name: 'S', description: '', is_static: true });
  });
  it('validates static/dynamic inputs', async () => {
    await expect(run({ action: createCohort, propsValue: { name: 'D' } })).rejects.toThrow('dynamic cohort needs');
    await expect(run({ action: createCohort, propsValue: { name: 'S', isStatic: true, matchProperties: { a: 1 } } })).rejects.toThrow('static cohort cannot');
    await expect(run({ action: createCohort, propsValue: { name: 'D', matchProperties: { a: { b: 1 } } } })).rejects.toThrow('must be text');
  });
  it('adds persons with deduped UUIDs', async () => {
    const spy = mock({ success: true });
    const out = await run({ action: addPersonsToStaticCohort, propsValue: { cohortId: '9', personIds: [P1, P2.toUpperCase(), P1] } });
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.PATCH);
    expect(req.url).toBe('https://eu.posthog.com/api/projects/123/cohorts/9/add_persons_to_static_cohort/');
    expect(req.body).toEqual({ person_ids: [P1, P2] });
    expect(out).toEqual({ cohortId: 9, addedPersonIds: [P1, P2], count: 2 });
  });
  it('rejects bad person ids', async () => {
    await expect(run({ action: addPersonsToStaticCohort, propsValue: { cohortId: '9', personIds: ['user@x.io'] } })).rejects.toThrow('UUID');
    await expect(run({ action: addPersonsToStaticCohort, propsValue: { cohortId: '9', personIds: [] } })).rejects.toThrow('at least one');
  });
});

describe('annotations', () => {
  it('gets an annotation', async () => {
    const spy = mock({ id: 5, content: 'v2', date_marker: '2026-10-18T00:00:00Z', scope: 'project' });
    const out = await run({ action: getAnnotation, propsValue: { annotationId: '5' } });
    expect(spy.mock.calls[0][0].url).toBe('https://eu.posthog.com/api/projects/123/annotations/5/');
    expect(out).toMatchObject({ id: 5, content: 'v2', scope: 'project' });
  });
  it('patches only given fields', async () => {
    const spy = mock({ id: 5, content: 'new' });
    await run({ action: updateAnnotation, propsValue: { annotationId: '5', content: ' new ' } });
    expect(spy.mock.calls[0][0].method).toBe(HttpMethod.PATCH);
    expect(spy.mock.calls[0][0].body).toEqual({ content: 'new' });
  });
  it('requires a change and a valid scope', async () => {
    await expect(run({ action: updateAnnotation, propsValue: { annotationId: '5' } })).rejects.toThrow('at least one');
    await expect(run({ action: updateAnnotation, propsValue: { annotationId: '5', scope: 'team' } })).rejects.toThrow('Scope');
  });
});
