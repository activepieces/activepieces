import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { clockodo } from '../src';
import createCustomer from '../src/lib/actions/customer/create-customer';
import updateCustomer from '../src/lib/actions/customer/update-customer';
import deleteCustomer from '../src/lib/actions/customer/delete-customer';
import listCustomers from '../src/lib/actions/customer/list-customers';
import createProject from '../src/lib/actions/project/create-project';
import updateProject from '../src/lib/actions/project/update-project';
import updateService from '../src/lib/actions/service/update-service';
import { clockodoAuth } from '../src/lib/auth';
import updateUser from '../src/lib/actions/user/update-user';
import createUser from '../src/lib/actions/user/create-user';
import createEntry from '../src/lib/actions/entry/create-entry';
import updateEntry from '../src/lib/actions/entry/update-entry';
import listEntries from '../src/lib/actions/entry/list-entries';
import createAbsence from '../src/lib/actions/absence/create-absence';
import updateAbsence from '../src/lib/actions/absence/update-absence';
import listAbsences from '../src/lib/actions/absence/list-absence';
import getAbsence from '../src/lib/actions/absence/get-absence';
import createTeam from '../src/lib/actions/team/create-team';
import updateTeam from '../src/lib/actions/team/update-team';
import deleteTeam from '../src/lib/actions/team/delete-team';
import startClock from '../src/lib/actions/clock/start-clock';
import stopClock from '../src/lib/actions/clock/stop-clock';
import getRunningClock from '../src/lib/actions/clock/get-running-clock';
import listLumpSumServices from '../src/lib/actions/service/list-lump-sum-services';
import listSubprojects from '../src/lib/actions/project/list-subprojects';
import {
  createMockActionContext,
  InputPropertyMap,
} from '@activepieces/pieces-framework';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

const sendRequest = vi.fn();


const AUTH = {
  email: ' me@example.org ',
  token: ' key-1 ',
  company_name: 'Acme',
  company_email: 'dev@acme.test',
};

const BASE = 'https://my.clockodo.com/api';

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function runAction({ action, propsValue }: { action: Runnable; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  return Reflect.apply(action.run, action, [{ ...base, auth: { type: 'CUSTOM_AUTH', props: AUTH } }]);
}

function lastRequest() {
  const calls = sendRequest.mock.calls;
  return calls[calls.length - 1][0];
}


afterEach(() => {
  sendRequest.mockReset();
});

const DEMOTED = [
  'create_customer', 'get_customer', 'update_customer', 'delete_customer',
  'create_project', 'get_project', 'update_project', 'delete_project',
  'get_service', 'update_service', 'delete_service',
  'create_user', 'get_user', 'update_user', 'delete_user',
  'get_team', 'create_entry', 'update_entry',
  'create_absence', 'update_absence', 'list_absences',
];

const BOTH = [
  'list_customers', 'list_projects', 'create_service', 'list_services', 'list_users', 'list_teams',
  'get_entry', 'delete_entry', 'list_entries', 'get_absence', 'delete_absence',
  'get_current_user', 'get_running_clock', 'stop_clock', 'create_team', 'update_team', 'delete_team',
  'list_lump_sum_services', 'list_subprojects',
];

describe('piece registration', () => {
  const actions = clockodo.actions();
  const list = Object.values(actions).filter((a) => a.name !== 'custom_api_call');

  it('registers 63 actions plus the custom API call with the planned audiences', () => {
    expect(list).toHaveLength(63);
    expect(actions['custom_api_call']).toBeDefined();
    for (const name of DEMOTED) {
      expect(actions[name]?.audience, name).toBe('human');
      expect(actions['ai_' + name]?.audience, 'ai_' + name).toBe('ai');
    }
    expect(actions['start_clock'].audience).toBe('human');
    expect(actions['ai_start_clock'].audience).toBe('ai');
    for (const name of BOTH) {
      expect(actions[name]?.audience, name).toBe('both');
    }
    expect(list.filter((a) => a.audience === 'human')).toHaveLength(22);
    expect(list.filter((a) => a.audience === 'ai')).toHaveLength(22);
    expect(list.filter((a) => a.audience === 'both')).toHaveLength(19);
  });

  it('gives every action an outputSchema, aiMetadata and classification', () => {
    for (const action of list) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
    }
  });

  it('keeps agent-facing actions free of dynamic or numeric dropdowns, arrays and defaults', () => {
    for (const action of list.filter((a) => a.audience !== 'human')) {
      for (const [key, prop] of Object.entries(action.props)) {
        expect(['DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'ARRAY'], `${action.name}.${key}`).not.toContain(prop.type);
        if (prop.type === 'STATIC_DROPDOWN') {
          for (const option of prop.options.options) {
            expect(typeof option.value, `${action.name}.${key}`).toBe('string');
          }
        }
        if (action.audience === 'ai') {
          expect(prop.defaultValue, `${action.name}.${key}`).toBeUndefined();
        }
      }
    }
  });

  it('registers both triggers with outputSchema and sampleData', () => {
    const triggers = Object.values(clockodo.triggers());
    expect(triggers.map((t) => t.name).sort()).toEqual(['new_absence_enquiry', 'new_entry']);
    for (const trigger of triggers) {
      expect(trigger.outputSchema).toBeDefined();
      expect(Object.keys(trigger.sampleData ?? {}).length).toBeGreaterThan(0);
    }
  });
});

describe('human action requests', () => {
  it('create customer posts the body to v3', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 5, name: 'Acme' } }));
    const res = await runAction({
      action: createCustomer,
      propsValue: { name: 'Acme', number: '', active: true, billable: false, note: 'n', color: 0xee9163 },
    });
    expect(res).toEqual({ id: 5, name: 'Acme' });
    const req = lastRequest();
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe(BASE + '/v3/customers');
    expect(req.body).toEqual({ name: 'Acme', number: null, active: true, billable_default: false, note: 'n', color: 1 });
  });

  it('create customer maps a saved RGB color and a new index to Clockodo 1-9', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 5 } }));
    await runAction({ action: createCustomer, propsValue: { name: 'A', color: 0xfc71d1 } });
    expect(lastRequest().body.color).toBe(9);
    await runAction({ action: createCustomer, propsValue: { name: 'A', color: 6 } });
    expect(lastRequest().body.color).toBe(6);
    await expect(runAction({ action: createCustomer, propsValue: { name: 'A', color: 12345 } })).rejects.toThrow(/index 1-9/);
  });

  it('update customer accepts a mapped string id and sends only given fields', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 5 } }));
    await runAction({ action: updateCustomer, propsValue: { customer_id: '5', name: 'New' } });
    const req = lastRequest();
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe(BASE + '/v3/customers/5');
    expect(req.body).toEqual({ name: 'New' });
  });

  it('rejects a bad id before any request', async () => {
    await expect(runAction({ action: deleteCustomer, propsValue: { customer_id: 'abc' } })).rejects.toThrow(/positive whole number/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('delete customer returns success and id', async () => {
    sendRequest.mockResolvedValue(ok({ success: true }));
    await expect(runAction({ action: deleteCustomer, propsValue: { customer_id: 9 } })).resolves.toEqual({ success: true, id: 9 });
    expect(lastRequest().method).toBe(HttpMethod.DELETE);
    expect(lastRequest().url).toBe(BASE + '/v3/customers/9');
  });

  it('list customers with page null reads all pages', async () => {
    sendRequest.mockResolvedValue(ok({ data: [{ id: 1 }], paging: { count_pages: 1 } }));
    const res = await runAction({ action: listCustomers, propsValue: { active_filter: true, page: null } });
    expect(res).toEqual({ customers: [{ id: 1 }] });
    expect(lastRequest().queryParams).toEqual({ 'filter[active]': 'true', page: '1' });
  });

  it('create project posts to v4', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({
      action: createProject,
      propsValue: { name: 'P', customer_id: 4, budget: 100, budget_is_hours: false, budget_is_not_strict: false },
    });
    expect(lastRequest().url).toBe(BASE + '/v4/projects');
    expect(lastRequest().body).toEqual({
      name: 'P',
      customers_id: 4,
      budget: { amount: 100, monetary: true, hard: true, from_subprojects: false },
    });
  });

  it('update project sends an hours-based soft budget object', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({
      action: updateProject,
      propsValue: { project_id: 3, budget: 40, budget_is_hours: true, budget_is_not_strict: true },
    });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v4/projects/3' });
    expect(lastRequest().body).toEqual({ budget: { amount: 40, monetary: false, hard: false, from_subprojects: false } });
  });

  it('update user puts to v3', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({ action: updateUser, propsValue: { user_id: 3, wage_type: 2, team_id: 8 } });
    expect(lastRequest().method).toBe(HttpMethod.PUT);
    expect(lastRequest().url).toBe(BASE + '/v3/users/3');
    expect(lastRequest().body).toEqual({ wage_type: 2, teams_id: 8 });
  });

  it('create entry strips milliseconds and validates order', async () => {
    sendRequest.mockResolvedValue(ok({ entry: { id: 1 } }));
    await runAction({
      action: createEntry,
      propsValue: { customer_id: 1, service_id: 2, time_since: '2026-01-01T09:00:00.000Z', time_until: '2026-01-01T10:00:00.000Z' },
    });
    expect(lastRequest().url).toBe(BASE + '/v2/entries');
    expect(lastRequest().body).toEqual({
      customers_id: 1,
      services_id: 2,
      time_since: '2026-01-01T09:00:00Z',
      time_until: '2026-01-01T10:00:00Z',
    });
    await expect(
      runAction({
        action: createEntry,
        propsValue: { customer_id: 1, service_id: 2, time_since: '2026-01-01T10:00:00Z', time_until: '2026-01-01T09:00:00Z' },
      })
    ).rejects.toThrow(/after Start Time/);
  });

  it('update entry refuses an empty update', async () => {
    await expect(runAction({ action: updateEntry, propsValue: { entry_id: 1 } })).rejects.toThrow(/at least one field/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('list entries uses the user filter key and passes enhanced_list in all-pages mode', async () => {
    sendRequest.mockResolvedValue(ok({ entries: [{ id: 1 }], paging: { count_pages: 1 } }));
    const res = await runAction({
      action: listEntries,
      propsValue: {
        time_since: '2026-01-01T00:00:00.000Z',
        time_until: '2026-02-01T00:00:00.000Z',
        user_id_filter: 7,
        enhanced_list: true,
        page: null,
      },
    });
    expect(res).toEqual({ entries: [{ id: 1 }] });
    expect(lastRequest().queryParams).toEqual({
      time_since: '2026-01-01T00:00:00Z',
      time_until: '2026-02-01T00:00:00Z',
      enhanced_list: 'true',
      'filter[users_id]': '7',
      page: '1',
    });
    expect(listEntries.props.user_id_filter.displayName).toBe('User ID Filter');
  });

  it('create absence posts to v4 without forcing count_days', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({
      action: createAbsence,
      propsValue: { date_since: '2026-12-28T00:00:00.000Z', date_until: '2027-01-02T00:00:00.000Z', type: 1, approved: false },
    });
    expect(lastRequest().url).toBe(BASE + '/v4/absences');
    expect(lastRequest().body).toEqual({ date_since: '2026-12-28', date_until: '2027-01-02', type: 1, status: 0 });
  });

  it('update absence puts to v4 with only given fields', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: updateAbsence, propsValue: { absence_id: 4, status: 1 } });
    expect(lastRequest().method).toBe(HttpMethod.PUT);
    expect(lastRequest().url).toBe(BASE + '/v4/absences/4');
    expect(lastRequest().body).toEqual({ status: 1 });
  });

  it('list absences filters by year and user', async () => {
    sendRequest.mockResolvedValue(ok({ data: [], paging: { count_pages: 1 } }));
    await runAction({ action: listAbsences, propsValue: { year: 2026, user_id: 3 } });
    expect(lastRequest().queryParams).toEqual({ 'filter[year]': '2026', 'filter[users_id]': '3', page: '1' });
  });
});

describe('list entries billable filter', () => {
  const base = { time_since: '2026-01-01T00:00:00Z', time_until: '2026-02-01T00:00:00Z' };
  it.each([
    [{}, undefined],
    [{ billable_filter: false }, '0'],
    [{ billable_filter: false, billed_filter: false }, '0'],
    [{ billable_filter: true }, '1'],
    [{ billed_filter: true }, '2'],
    [{ billable_filter: true, billable_status: 'all' }, undefined],
    [{ billable_filter: true, billable_status: 'not_billable' }, '0'],
    [{ billed_filter: true, billable_status: 'billable' }, '1'],
    [{ billable_status: 'billed' }, '2'],
  ])('%j sends filter[billable]=%s', async (props, expected) => {
    sendRequest.mockResolvedValue(ok({ entries: [], paging: { count_pages: 1 } }));
    await runAction({ action: listEntries, propsValue: { ...base, ...props } });
    expect(lastRequest().queryParams['filter[billable]']).toBe(expected);
  });

  it('rejects an unknown billable status', async () => {
    await expect(runAction({ action: listEntries, propsValue: { ...base, billable_status: 'x' } })).rejects.toThrow(/Billable Status/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('untouched checkboxes keep saved state', () => {
  const cases: [string, Runnable, Record<string, unknown>, string][] = [
    ['update user active', updateUser, { user_id: 3 }, 'active'],
    ['update user see absences', updateUser, { user_id: 3 }, 'can_generally_see_absences'],
    ['update user manage absences', updateUser, { user_id: 3 }, 'can_generally_manage_absences'],
    ['update user add customers', updateUser, { user_id: 3 }, 'can_add_customers'],
    ['update customer active', updateCustomer, { customer_id: 5 }, 'active'],
    ['update customer billable', updateCustomer, { customer_id: 5 }, 'billable'],
    ['update project active', updateProject, { project_id: 7 }, 'active'],
    ['update project billable', updateProject, { project_id: 7 }, 'billable'],
    ['update service active', updateService, { service_id: 9 }, 'active'],
  ];
  const bodyKey = (prop: string) => (prop === 'billable' ? 'billable_default' : prop);

  it.each(cases)('%s: unticked sends nothing, ticked true, status no false, status yes overrides', async (_label, action, ids, prop) => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action, propsValue: { ...ids, name: 'N', [prop]: false } });
    expect(lastRequest().body).not.toHaveProperty(bodyKey(prop));
    await runAction({ action, propsValue: { ...ids, [prop]: true } });
    expect(lastRequest().body[bodyKey(prop)]).toBe(true);
    await runAction({ action, propsValue: { ...ids, [prop]: true, [prop + '_status']: 'no' } });
    expect(lastRequest().body[bodyKey(prop)]).toBe(false);
    await runAction({ action, propsValue: { ...ids, [prop]: false, [prop + '_status']: 'yes' } });
    expect(lastRequest().body[bodyKey(prop)]).toBe(true);
    await runAction({ action, propsValue: { ...ids, name: 'N', [prop]: false, [prop + '_status']: 'keep' } });
    expect(lastRequest().body).not.toHaveProperty(bodyKey(prop));
  });

  it('rejects an unknown status value', async () => {
    await expect(runAction({ action: updateService, propsValue: { service_id: 9, active_status: 'maybe' } })).rejects.toThrow(/keep, yes or no/);
  });

  it.each([
    [{ billable: false }, undefined],
    [{ billable: true }, 1],
    [{ billable: true, billable_status: 'no' }, 0],
  ])('start clock %j sends billable %s', async (props, expected) => {
    sendRequest.mockResolvedValue(ok({ running: { id: 1 } }));
    await runAction({ action: startClock, propsValue: { customer_id: 1, service_id: 2, ...props } });
    expect(lastRequest().body.billable).toBe(expected);
  });

  it('budget amount only keeps the stored hours/soft flags', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 7, budget: { amount: 10, monetary: false, hard: false, from_subprojects: true } } }))
      .mockResolvedValueOnce(ok({ data: { id: 7 } }));
    await runAction({ action: updateProject, propsValue: { project_id: 7, budget: 99, budget_is_hours: false, budget_is_not_strict: false } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: BASE + '/v4/projects/7' });
    expect(lastRequest().body).toEqual({ budget: { amount: 99, monetary: false, hard: false, from_subprojects: true } });
  });

  it('budget amount with one flag set overrides only that flag', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 7, budget: { amount: 10, monetary: true, hard: false, from_subprojects: false } } }))
      .mockResolvedValueOnce(ok({ data: { id: 7 } }));
    await runAction({ action: updateProject, propsValue: { project_id: 7, budget: 5, budget_is_hours: true } });
    expect(lastRequest().body).toEqual({ budget: { amount: 5, monetary: false, hard: false, from_subprojects: false } });
  });

  it('reports that fields were saved when completing fails', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 7 } }))
      .mockRejectedValueOnce(new HttpError({}, { status: 422, responseBody: { errors: [{ message: 'Needs a billable entry.' }] } }));
    await expect(runAction({ action: updateProject, propsValue: { project_id: 7, name: 'N', completed: true } })).rejects.toThrow(
      /^Project fields were updated, but marking it completed failed: Clockodo complete project failed \(422\): Needs a billable entry/
    );
  });
});

describe('auth validate', () => {
  const validate = (props: Record<string, string>) =>
    Reflect.apply(Reflect.get(clockodoAuth, 'validate'), clockodoAuth, [
      { auth: { email: 'me@x.test', token: 'k', ...props }, server: { apiUrl: '', publicUrl: '' } },
    ]);

  it('rejects an identification longer than 50 characters before calling Clockodo', async () => {
    const res = await validate({ company_name: 'a'.repeat(30), company_email: 'b'.repeat(20) });
    expect(res).toEqual({ valid: false, error: expect.stringMatching(/at most 50 characters/) });
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('accepts exactly 50 characters and checks the credentials', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    const res = await validate({ company_name: 'a'.repeat(29), company_email: 'b'.repeat(20) });
    expect(res).toEqual({ valid: true });
    expect(lastRequest().url).toBe(BASE + '/v4/users/me');
  });
});

describe('round 7', () => {
  it.each([
    ['Worker', 'worker'],
    ['owner', 'owner'],
  ])('create user role %s sends %s', async (role, expected) => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: createUser, propsValue: { name: 'J', email: 'j@x.test', role } });
    expect(lastRequest().body.role).toBe(expected);
  });

  it('rejects teamleader and unknown roles before any request', async () => {
    await expect(runAction({ action: createUser, propsValue: { name: 'J', email: 'j@x.test', role: 'teamleader' } })).rejects.toThrow(
      /no team leader role/
    );
    await expect(runAction({ action: updateUser, propsValue: { user_id: 3, role: 'admin' } })).rejects.toThrow(/worker or owner/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('update user team status remove sends teams_id null', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({ action: updateUser, propsValue: { user_id: 3, team_id: 8, team_status: 'remove' } });
    expect(lastRequest().body).toEqual({ teams_id: null });
    await runAction({ action: updateUser, propsValue: { user_id: 3, team_id: 8, team_status: 'keep' } });
    expect(lastRequest().body).toEqual({ teams_id: 8 });
  });

  it('create and update team send leader when given', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 2 } }));
    await runAction({ action: createTeam, propsValue: { name: 'T', leader_id: '489171' } });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.POST, url: BASE + '/v3/teams', body: { name: 'T', leader: 489171 } });
    await runAction({ action: updateTeam, propsValue: { team_id: '2', name: 'U', leader_id: '5' } });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v3/teams/2', body: { name: 'U', leader: 5 } });
    await runAction({ action: updateTeam, propsValue: { team_id: '2', name: 'U' } });
    expect(lastRequest().body).toEqual({ name: 'U' });
    await expect(runAction({ action: createTeam, propsValue: { name: 'T', leader_id: 'x' } })).rejects.toThrow(/Leader User ID/);
  });

  it('billing descriptions say it marks all entries', () => {
    expect(updateProject.props.billing_complete.description).toMatch(/Marks all entries of this project as billed \(Yes\) or not billed \(No\)/);
    expect(updateProject.props.billed_amount.description).toMatch(/^Not used: Clockodo no longer has a billed amount/);
  });
});

describe('ui polish', () => {
  it('omits pagination when Clockodo sends no paging', async () => {
    sendRequest.mockResolvedValue(ok({ data: [{ id: 1 }] }));
    await expect(runAction({ action: listCustomers, propsValue: { page: 1 } })).resolves.toEqual({ customers: [{ id: 1 }] });
  });

  it('includes pagination when present', async () => {
    sendRequest.mockResolvedValue(ok({ data: [], paging: { count_pages: 2, current_page: 1 } }));
    await expect(runAction({ action: listCustomers, propsValue: { page: 1 } })).resolves.toEqual({
      customers: [],
      pagination: { count_pages: 2, current_page: 1 },
    });
  });

  it('orders Create Entry required fields first and explains inactive-first deletes', () => {
    expect(Object.keys(createEntry.props).slice(0, 5)).toEqual(['customer_id', 'service_id', 'time_since', 'time_until', 'project_id']);
    expect(deleteCustomer.description).toMatch(/inactive first/);
    expect(deleteCustomer.props.customer_id.description).toMatch(/Only inactive customers/);
  });
});

describe('project completion and billing', () => {
  it('ticked completed updates then calls the complete route', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 3 } })).mockResolvedValueOnce(ok({ data: { id: 3, completed: true } }));
    const res = await runAction({ action: updateProject, propsValue: { project_id: 3, name: 'N', completed: true } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v4/projects/3', body: { name: 'N' } });
    expect(sendRequest.mock.calls[1][0]).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v4/projects/3/complete', body: { completed: true } });
    expect(res).toEqual({ id: 3, completed: true });
  });

  it('billed amount and ticked billing complete call setBilled after the update', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 3 } }))
      .mockResolvedValueOnce(ok({ success: true }))
      .mockResolvedValueOnce(ok({ data: { id: 3, billed_completely: true } }));
    const res = await runAction({ action: updateProject, propsValue: { project_id: 3, name: 'N', billed_amount: 1200, billing_complete: true } });
    expect(sendRequest.mock.calls[0][0].body).toEqual({ name: 'N' });
    expect(sendRequest.mock.calls[1][0]).toMatchObject({
      method: HttpMethod.PUT,
      url: BASE + '/v3/projects/3/setBilled',
      body: { billed: true },
    });
    expect(res).toEqual({ id: 3, billed_completely: true });
  });

  it('billing complete status no sends billed false only', async () => {
    sendRequest.mockResolvedValueOnce(ok({ success: true })).mockResolvedValueOnce(ok({ data: { id: 3 } }));
    await runAction({ action: updateProject, propsValue: { project_id: 3, billing_complete: true, billing_complete_status: 'no' } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({ url: BASE + '/v3/projects/3/setBilled', body: { billed: false } });
  });

  it('billed amount alone sends nothing to setBilled', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({ action: updateProject, propsValue: { project_id: 3, name: 'N', billed_amount: 1200 } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body).toEqual({ name: 'N' });
  });

  it('untouched billing props never call setBilled', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({ action: updateProject, propsValue: { project_id: 3, name: 'N', completed: false, billing_complete: false } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().url).toBe(BASE + '/v4/projects/3');
  });

  it('reports a partial save when setBilled fails after the update', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 3 } }))
      .mockRejectedValueOnce(new HttpError({}, { status: 403, responseBody: { errors: [{ message: 'Access denied.' }] } }));
    await expect(runAction({ action: updateProject, propsValue: { project_id: 3, name: 'N', billing_complete: true } })).rejects.toThrow(
      /^Project fields were updated, but setting the billing state failed: Clockodo set project billing failed \(403\): Access denied/
    );
  });

  it('reports fields and billing saved when completing fails', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 3 } }))
      .mockResolvedValueOnce(ok({ success: true }))
      .mockRejectedValueOnce(new HttpError({}, { status: 422, responseBody: { errors: [{ message: 'Needs a billable entry.' }] } }));
    await expect(
      runAction({ action: updateProject, propsValue: { project_id: 3, name: 'N', billing_complete: true, completed: true } })
    ).rejects.toThrow(/^Project fields and billing were updated, but marking it completed failed/);
  });

  it('only completed set skips the main update', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3, completed: true } }));
    await runAction({ action: updateProject, propsValue: { project_id: 3, completed: true } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().url).toBe(BASE + '/v4/projects/3/complete');
  });

  it('surfaces the 422 from the complete route', async () => {
    sendRequest.mockRejectedValue(
      new HttpError({}, { status: 422, responseBody: { errors: [{ message: 'The project needs at least one billable entry.', path: null }] } })
    );
    await expect(runAction({ action: updateProject, propsValue: { project_id: 3, completed: true } })).rejects.toThrow(
      'Clockodo complete project failed (422): The project needs at least one billable entry.'
    );
  });
});

describe('absence half day', () => {
  it('derives half_day from count_days on reads', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 1, count_days: 0.5 } }));
    await expect(runAction({ action: getAbsence, propsValue: { absence_id: 1 } })).resolves.toEqual({ id: 1, count_days: 0.5, half_day: true });
    sendRequest.mockResolvedValueOnce(ok({ data: [{ id: 2, count_days: 3 }] }));
    await expect(runAction({ action: listAbsences, propsValue: { year: 2026 } })).resolves.toEqual({
      absences: [{ id: 2, count_days: 3, half_day: false }],
    });
  });

  it.each([
    [{ half_days: true }, { half_day: true }],
    [{ half_days: true, half_days_status: 'no' }, { half_day: false }],
    [{ half_days: false, half_days_status: 'yes' }, { half_day: true }],
    [{ half_days: false, note: 'n' }, { note: 'n' }],
  ])('update %j sends %j without a lookup', async (props, body) => {
    sendRequest.mockResolvedValue(ok({ data: { id: 4 } }));
    await runAction({ action: updateAbsence, propsValue: { absence_id: 4, ...props } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT });
    expect(lastRequest().body).toEqual(body);
  });

  it('update with only an unticked half day box is an empty update', async () => {
    await expect(runAction({ action: updateAbsence, propsValue: { absence_id: 4, half_days: false } })).rejects.toThrow(/at least one field/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('update without half days sends no half_day', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 4 } }));
    await runAction({ action: updateAbsence, propsValue: { absence_id: 4, note: 'y' } });
    expect(lastRequest().body).toEqual({ note: 'y' });
  });

  it('create sends half_day and omits an unticked sick note', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({
      action: createAbsence,
      propsValue: { date_since: '2026-12-28', date_until: '2026-12-28', type: 1, half_days: true, sick_note: false },
    });
    expect(lastRequest().body).toEqual({ date_since: '2026-12-28', date_until: '2026-12-28', type: 1, half_day: true, status: 0 });
  });
});

describe('new actions', () => {
  it('team create, update and delete hit v3', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 2, name: 'T' } }));
    await runAction({ action: createTeam, propsValue: { name: ' T ' } });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.POST, url: BASE + '/v3/teams', body: { name: 'T' } });
    await runAction({ action: updateTeam, propsValue: { team_id: '2', name: 'U' } });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v3/teams/2', body: { name: 'U' } });
    await expect(runAction({ action: deleteTeam, propsValue: { team_id: '2' } })).resolves.toEqual({ success: true, id: 2 });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.DELETE, url: BASE + '/v3/teams/2' });
  });

  it('start clock posts to v2/clock and returns the running entry', async () => {
    sendRequest.mockResolvedValue(ok({ running: { id: 11 }, stopped: null }));
    const res = await runAction({ action: startClock, propsValue: { customer_id: 1, service_id: 2, billable: true } });
    expect(res).toEqual({ id: 11 });
    expect(lastRequest()).toMatchObject({
      method: HttpMethod.POST,
      url: BASE + '/v2/clock',
      body: { customers_id: 1, services_id: 2, billable: 1 },
    });
  });

  it('stop clock without an id stops the running entry', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ running: { id: 11 } }))
      .mockResolvedValueOnce(ok({ stopped: { id: 11, time_until: 'x' }, running: null }));
    await expect(runAction({ action: stopClock, propsValue: {} })).resolves.toEqual({ id: 11, time_until: 'x' });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.DELETE, url: BASE + '/v2/clock/11' });
  });

  it('stop clock fails clearly when nothing runs', async () => {
    sendRequest.mockResolvedValue(ok({ running: null }));
    await expect(runAction({ action: stopClock, propsValue: {} })).rejects.toThrow(/No Clockodo clock is running/);
  });

  it('get running clock returns null when idle', async () => {
    sendRequest.mockResolvedValue(ok({ running: null }));
    await expect(runAction({ action: getRunningClock, propsValue: {} })).resolves.toEqual({ running: null });
  });

  it('lump-sum services and subprojects list every page', async () => {
    sendRequest.mockResolvedValue(ok({ data: [{ id: 1 }], paging: { count_pages: 1 } }));
    await expect(runAction({ action: listLumpSumServices, propsValue: { active_only: true } })).resolves.toEqual({
      lump_sum_services: [{ id: 1 }],
    });
    expect(lastRequest()).toMatchObject({ url: BASE + '/v4/lumpSumServices', queryParams: { 'filter[active]': 'true', page: '1' } });
    sendRequest.mockResolvedValue(ok({ data: [{ id: 2 }], paging: { count_pages: 1 } }));
    await expect(runAction({ action: listSubprojects, propsValue: { project_id: '9' } })).resolves.toEqual({ subprojects: [{ id: 2 }] });
    expect(lastRequest()).toMatchObject({ url: BASE + '/v3/subprojects', queryParams: { 'filter[projects_id]': '9', page: '1' } });
  });
});

type Runnable = { run: unknown };
