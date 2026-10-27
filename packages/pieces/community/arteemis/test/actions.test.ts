import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { arteemis } from '../src';
import { arteemisAuth } from '../src/lib/auth';
import { API_KEY, call, fail, makeContext, ok, startFakeArteemis } from './helpers';

const CONTACT_ID = '5b8f1c7e-2a4d-4e8b-9c3f-1d2e3f4a5b6c';
const ORG_ID = '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f6a';
const LIST_ID = '3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f';
const CAMPAIGN_ID = '0e2b6f4a-8c1d-4f3e-9a7b-5c6d7e8f9a0b';
const JOB_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

let api: Awaited<ReturnType<typeof startFakeArteemis>>;
const actions = arteemis.actions();
const bodiesOf = (tool: string) => api.calls.filter((c) => c.tool === tool).map((c) => c.body);

beforeAll(async () => {
  api = await startFakeArteemis();
});
afterAll(() => api.close());
afterEach(() => {
  api.reset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Create or Update Contact', () => {
  const props = {
    full_name: ' Claire Martin ',
    email: 'claire.martin@example.com',
    title: 'Head of Sales',
    company: 'Acme',
    list_id: LIST_ID,
    custom_fields: { industry_segment: 'SaaS' },
  };

  it('creates a new person in the list, with the company and custom fields', async () => {
    api.aim();
    api.routes['contacts_manage'] = () => ok({ contact_id: CONTACT_ID, existed: false, organization_id: ORG_ID });
    const result = await call(actions['create_or_update_contact'].run, makeContext(props));
    expect(bodiesOf('contacts_manage')).toEqual([
      {
        operation: 'create',
        contact: {
          kind: 'person',
          full_name: 'Claire Martin',
          email: 'claire.martin@example.com',
          role: 'Head of Sales',
          organization_name: 'Acme',
          custom_fields: { industry_segment: 'SaaS' },
        },
        list_id: LIST_ID,
      },
    ]);
    expect(api.calls[0].authorization).toBe(`Bearer ${API_KEY}`);
    expect(result).toEqual({ id: CONTACT_ID, created: true, updated: false, organization_id: ORG_ID, list_id: LIST_ID });
  });

  it('updates the contact that already exists', async () => {
    api.aim();
    api.routes['contacts_manage'] = (body) =>
      body['operation'] === 'create' ? ok({ contact_id: CONTACT_ID, existed: true, organization_id: ORG_ID }) : ok({ contact_id: CONTACT_ID });
    const result = await call(actions['create_or_update_contact'].run, makeContext(props));
    expect(bodiesOf('contacts_manage')[1]).toEqual({
      operation: 'update',
      contact_id: CONTACT_ID,
      patch: {
        full_name: 'Claire Martin',
        email: 'claire.martin@example.com',
        role: 'Head of Sales',
        custom_fields: { industry_segment: 'SaaS' },
        organization_id: ORG_ID,
      },
    });
    expect(result).toMatchObject({ created: false, updated: true });
  });
});

describe('list, campaign, pipeline and task actions', () => {
  it('Add Contact to List', async () => {
    api.aim();
    api.routes['contact_lists_manage'] = () => ok({ added: 1, total: 413 });
    const result = await call(actions['add_contact_to_list'].run, makeContext({ list_id: LIST_ID, contact_id: ` ${CONTACT_ID} ` }));
    expect(bodiesOf('contact_lists_manage')).toEqual([{ operation: 'add_contacts', list_id: LIST_ID, contact_ids: [CONTACT_ID] }]);
    expect(result).toEqual({ list_id: LIST_ID, contact_id: CONTACT_ID, added: 1, list_total: 413 });
  });

  it('Enroll Contact in Campaign', async () => {
    api.aim();
    api.routes['campaigns_enroll'] = () => ok({ id: JOB_ID, status: 'queued' }, { job_id: JOB_ID });
    const result = await call(actions['enroll_contact_in_campaign'].run, makeContext({ campaign_id: CAMPAIGN_ID, contact_id: CONTACT_ID }));
    expect(bodiesOf('campaigns_enroll')).toEqual([{ campaign_id: CAMPAIGN_ID, contact_ids: [CONTACT_ID] }]);
    expect(result).toEqual({ campaign_id: CAMPAIGN_ID, contact_id: CONTACT_ID, job_id: JOB_ID, job_status: 'queued' });
  });

  it('Add or Move Contact in Pipeline adds, then moves', async () => {
    api.aim();
    api.routes['deals_manage'] = (body) =>
      body['operation'] === 'add'
        ? ok({ added_contact_ids: [CONTACT_ID], stopped_enrollments: 1, stage: 'New' })
        : ok({ stage: 'Meeting booked', stage_id: 'meeting' });
    const result = await call(actions['add_or_move_contact_in_pipeline'].run, makeContext({ contact_id: CONTACT_ID, stage: 'meeting' }));
    expect(bodiesOf('deals_manage')).toEqual([
      { operation: 'add', contact_ids: [CONTACT_ID] },
      { operation: 'move', contact_id: CONTACT_ID, stage: 'meeting' },
    ]);
    expect(result).toEqual({ contact_id: CONTACT_ID, added: true, stopped_enrollments: 1, stage: 'Meeting booked', stage_id: 'meeting' });
  });

  it('Add or Move Contact in Pipeline without a stage only adds', async () => {
    api.aim();
    api.routes['deals_manage'] = () => ok({ added_contact_ids: [], stopped_enrollments: 0, stage: 'New' });
    const result = await call(actions['add_or_move_contact_in_pipeline'].run, makeContext({ contact_id: CONTACT_ID }));
    expect(bodiesOf('deals_manage')).toHaveLength(1);
    expect(result).toEqual({ contact_id: CONTACT_ID, added: false, stopped_enrollments: 0, stage: 'New', stage_id: null });
  });

  it('Create Task sends the due date in UTC and leaves out empty fields', async () => {
    api.aim();
    api.routes['tasks_manage'] = () => ok({ task_id: '8a9b0c1d-2e3f-4a4b-9c5d-6e7f8a9b0c1d' });
    const result = await call(actions['create_task'].run, makeContext({ title: 'Call Claire', kind: 'call', due_at: '2026-10-28T10:00:00+01:00', note: '' }));
    expect(bodiesOf('tasks_manage')).toEqual([{ operation: 'create', title: 'Call Claire', kind: 'call', due_at: '2026-10-28T09:00:00.000Z' }]);
    expect(result).toMatchObject({ id: '8a9b0c1d-2e3f-4a4b-9c5d-6e7f8a9b0c1d', contact_id: null });
  });

  it('Create Task refuses a date it cannot read before calling the API', async () => {
    api.aim();
    await expect(call(actions['create_task'].run, makeContext({ title: 'Call', kind: 'call', due_at: 'next tuesday' }))).rejects.toThrow('not a date');
    expect(api.calls).toHaveLength(0);
  });
});

describe('Find Contact', () => {
  it('matches on email, then returns the contact flat', async () => {
    api.aim();
    api.routes['contacts_query'] = () => ok({ rows: [{ index: 0, contact_id: CONTACT_ID }] });
    api.routes['contacts_get'] = () =>
      ok({ id: CONTACT_ID, name: 'Claire Martin', email: 'claire.martin@example.com', organizationName: 'Acme', customFields: { industry_segment: 'SaaS' } });
    const result = await call(actions['find_contact'].run, makeContext({ email: 'claire.martin@example.com' }));
    expect(bodiesOf('contacts_query')).toEqual([{ match: [{ kind: 'person', email: 'claire.martin@example.com' }] }]);
    expect(result).toMatchObject({ found: true, id: CONTACT_ID, company: 'Acme', custom_fields_industry_segment: 'SaaS' });
  });

  it('answers found false when nobody matches', async () => {
    api.aim();
    api.routes['contacts_query'] = () => ok({ rows: [{ index: 0, contact_id: null }] });
    expect(await call(actions['find_contact'].run, makeContext({ linkedin_url: 'https://www.linkedin.com/in/nobody' }))).toEqual({ found: false });
  });

  it('needs an email or a LinkedIn profile URL', async () => {
    api.aim();
    await expect(call(actions['find_contact'].run, makeContext({}))).rejects.toThrow('Give an email or a LinkedIn profile URL');
    expect(api.calls).toHaveLength(0);
  });
});

describe('errors, connection and dropdowns', () => {
  it("passes the API's refusal through, and explains a refused key", async () => {
    api.aim();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.routes['tasks_manage'] = () => fail(404, 'NOT_FOUND', 'No contact 5b8f... in this workspace.');
    await expect(
      call(actions['create_task'].run, makeContext({ title: 'Call', kind: 'call', due_at: '2026-10-28T09:00:00Z', contact_id: CONTACT_ID }))
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'No contact 5b8f... in this workspace.' });
    api.routes['contacts_query'] = () => fail(401, 'UNAUTHORIZED', 'Missing or invalid token');
    await expect(call(actions['find_contact'].run, makeContext({ email: 'a@example.com' }))).rejects.toThrow('Arteemis refused the API key');
  });

  it('validates the key with workspaces_list and names the connection after the workspace', async () => {
    api.aim();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.routes['workspaces_list'] = () => ok({ active_workspace_id: 'org_1', workspaces: [{ id: 'org_1', name: 'Acme Sales', active: true }] });
    const server = { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200' };
    expect(await call(arteemisAuth.validate, { auth: API_KEY, server })).toEqual({ valid: true });
    expect(await call(arteemisAuth.getConnectionIdentifier, { auth: API_KEY, server })).toBe('Acme Sales');
    api.routes['workspaces_list'] = () => fail(401, 'UNAUTHORIZED', 'Missing or invalid token');
    expect(await call(arteemisAuth.validate, { auth: 'art_key_revoked', server })).toMatchObject({ valid: false });
    expect(await call(arteemisAuth.getConnectionIdentifier, { auth: 'art_key_revoked', server })).toBeUndefined();
  });

  it('the campaign dropdown follows the cursor', async () => {
    api.aim();
    api.routes['campaigns_find'] = (body) =>
      body['cursor']
        ? ok({ rows: [{ id: 'c2', name: 'Two', status: 'paused' }] })
        : ok({ rows: [{ id: 'c1', name: 'One', status: 'active' }] }, { next_cursor: '11111111-1111-4111-8111-111111111111' });
    const prop = actions['enroll_contact_in_campaign'].props['campaign_id'];
    const options = await call(Reflect.get(prop, 'options'), { auth: makeContext().auth });
    expect(options).toEqual({ disabled: false, options: [{ label: 'One (active)', value: 'c1' }, { label: 'Two (paused)', value: 'c2' }] });
    expect(bodiesOf('campaigns_find')).toEqual([{ limit: 50 }, { limit: 50, cursor: '11111111-1111-4111-8111-111111111111' }]);
  });

  it('the list dropdown offers person lists only, and asks to connect first', async () => {
    api.aim();
    api.routes['contact_lists_list'] = () =>
      ok([
        { id: LIST_ID, name: 'Heads of Sales', kind: 'person', members: 412 },
        { id: 'o1', name: 'Accounts', kind: 'organization', members: 80 },
      ]);
    const prop = actions['add_contact_to_list'].props['list_id'];
    expect(await call(Reflect.get(prop, 'options'), { auth: makeContext().auth })).toEqual({
      disabled: false,
      options: [{ label: 'Heads of Sales (412)', value: LIST_ID }],
    });
    expect(await call(Reflect.get(prop, 'options'), { auth: undefined })).toMatchObject({ disabled: true });
  });
});
