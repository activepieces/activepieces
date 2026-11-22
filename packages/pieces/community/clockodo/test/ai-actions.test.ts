import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiCreateCustomer, aiDeleteCustomer, aiUpdateCustomer } from '../src/lib/actions/ai/ai-customer';
import { aiCreateEntry, aiUpdateEntry } from '../src/lib/actions/ai/ai-entry';
import { aiCreateAbsence, aiListAbsences, aiUpdateAbsence } from '../src/lib/actions/ai/ai-absence';
import { aiCreateUser, aiUpdateUser } from '../src/lib/actions/ai/ai-user';
import { aiUpdateProject } from '../src/lib/actions/ai/ai-project';
import { aiStartClock } from '../src/lib/actions/ai/ai-clock';
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

describe('ai twins send the same requests as the human actions', () => {
  it('create customer maps yes/no and named color', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: aiCreateCustomer, propsValue: { name: 'Acme', active: 'yes', billable: 'no', color: 'blue' } });
    expect(lastRequest()).toMatchObject({
      method: HttpMethod.POST,
      url: BASE + '/v3/customers',
      body: { name: 'Acme', active: true, billable_default: false, color: 6 },
    });
  });

  it('update customer sends only given fields', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: aiUpdateCustomer, propsValue: { customer_id: '12', note: '' } });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v3/customers/12' });
    expect(lastRequest().body).toEqual({ note: null });
  });

  it('create entry normalises offsets to UTC', async () => {
    sendRequest.mockResolvedValue(ok({ entry: { id: 1 } }));
    await runAction({
      action: aiCreateEntry,
      propsValue: {
        customer_id: '1',
        service_id: '2',
        project_id: '3',
        time_since: '2026-03-31T11:00:00+02:00',
        time_until: '2026-03-31T10:30:00Z',
      },
    });
    expect(lastRequest().body).toEqual({
      customers_id: 1,
      services_id: 2,
      projects_id: 3,
      time_since: '2026-03-31T09:00:00Z',
      time_until: '2026-03-31T10:30:00Z',
    });
  });

  it('create absence maps type code and approval', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({
      action: aiCreateAbsence,
      propsValue: { date_since: '2026-12-28', date_until: '2027-01-02', type: '4', approved: 'yes', half_days: 'no' },
    });
    expect(lastRequest().body).toEqual({ date_since: '2026-12-28', date_until: '2027-01-02', type: 4, half_day: false, status: 1 });
  });

  it('update absence maps status names', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: aiUpdateAbsence, propsValue: { absence_id: '5', status: 'declined' } });
    expect(lastRequest()).toMatchObject({ url: BASE + '/v4/absences/5', body: { status: 2 } });
  });

  it('create user maps wage type and language', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({
      action: aiCreateUser,
      propsValue: { name: 'Jo', email: 'jo@x.test', role: 'worker', wage_type: 'hourly', language: 'de', team_id: '4' },
    });
    expect(lastRequest().body).toEqual({ name: 'Jo', email: 'jo@x.test', role: 'worker', wage_type: 2, language: 'de', teams_id: 4 });
  });

  it('update project moves the customer and marks completed', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: aiUpdateProject, propsValue: { project_id: '7', customer_id: '8', completed: 'yes' } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({ url: BASE + '/v4/projects/7', body: { customers_id: 8 } });
    expect(lastRequest()).toMatchObject({ url: BASE + '/v4/projects/7/complete', body: { completed: true } });
  });

  it('start clock posts string ids as numbers', async () => {
    sendRequest.mockResolvedValue(ok({ running: { id: 3 } }));
    await expect(runAction({ action: aiStartClock, propsValue: { customer_id: '1', service_id: '2' } })).resolves.toEqual({ id: 3 });
    expect(lastRequest().body).toEqual({ customers_id: 1, services_id: 2 });
  });

  it('list absences parses the year string', async () => {
    sendRequest.mockResolvedValue(ok({ data: [{ id: 1 }] }));
    await expect(runAction({ action: aiListAbsences, propsValue: { year: '2026' } })).resolves.toEqual({ absences: [{ id: 1, half_day: false }] });
  });
});

describe('ai update absence half day', () => {
  it.each([
    ['yes', { half_day: true }],
    ['no', { half_day: false }],
    [undefined, { note: 'n' }],
  ])('half_days %s', async (value, body) => {
    sendRequest.mockResolvedValue(ok({ data: { id: 5 } }));
    await runAction({ action: aiUpdateAbsence, propsValue: { absence_id: '5', half_days: value, note: value ? undefined : 'n' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().body).toEqual(body);
  });
});

describe('ai color names', () => {
  it.each([
    ['turquoise', 4],
    ['caribbean', 4],
    ['light_blue', 5],
    ['lightblue', 5],
  ])('%s maps to %s', async (color, index) => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: aiCreateCustomer, propsValue: { name: 'A', color } });
    expect(lastRequest().body.color).toBe(index);
  });
});

describe('ai project completion', () => {
  it('no reopens via the complete route', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 7, completed: false } }));
    await runAction({ action: aiUpdateProject, propsValue: { project_id: '7', completed: 'no' } });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: BASE + '/v4/projects/7/complete', body: { completed: false } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('billing yes calls setBilled and billed amount is not offered', async () => {
    sendRequest.mockResolvedValueOnce(ok({ success: true })).mockResolvedValueOnce(ok({ data: { id: 7 } }));
    await runAction({ action: aiUpdateProject, propsValue: { project_id: '7', billing_complete: 'yes' } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.PUT,
      url: BASE + '/v3/projects/7/setBilled',
      body: { billed: true },
    });
    expect(Object.keys(aiUpdateProject.props)).not.toContain('billed_amount');
  });
});

describe('ai twins omit unset yes/no fields', () => {
  it('update customer with only a name sends only the name', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await runAction({ action: aiUpdateCustomer, propsValue: { customer_id: '1', name: 'N' } });
    expect(lastRequest().body).toEqual({ name: 'N' });
  });

  it('budget amount only keeps the stored flags', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: 7, budget: { amount: 1, monetary: false, hard: true, from_subprojects: false } } }))
      .mockResolvedValueOnce(ok({ data: { id: 7 } }));
    await runAction({ action: aiUpdateProject, propsValue: { project_id: '7', budget: 3 } });
    expect(lastRequest().body).toEqual({ budget: { amount: 3, monetary: false, hard: true, from_subprojects: false } });
  });
});

describe('ai users round 7', () => {
  it('team_id none removes the user from the team', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 3 } }));
    await runAction({ action: aiUpdateUser, propsValue: { user_id: '3', team_id: 'none' } });
    expect(lastRequest().body).toEqual({ teams_id: null });
  });

  it('role offers only worker and owner and rejects teamleader', async () => {
    expect(aiCreateUser.props.role.options.options.map((o) => o.value)).toEqual(['worker', 'owner']);
    await expect(runAction({ action: aiUpdateUser, propsValue: { user_id: '3', role: 'teamleader' } })).rejects.toThrow(/no team leader role/);
  });
});

describe('ai project budget', () => {
  it('rejects budget flags without an amount', async () => {
    await expect(runAction({ action: aiUpdateProject, propsValue: { project_id: '7', budget_is_hours: 'yes' } })).rejects.toThrow(/Set Budget as well/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('ai twin validation happens before any request', () => {
  it.each([
    ['bad id', aiDeleteCustomer, { customer_id: '12abc' }, /positive whole number/],
    ['negative id', aiDeleteCustomer, { customer_id: '-3' }, /positive whole number/],
    ['non-ISO date-time', aiCreateEntry, { customer_id: '1', service_id: '2', time_since: '31.03.2026 09:00', time_until: '2026-03-31T10:00:00Z' }, /ISO-8601 date-time/],
    ['date-time without zone', aiCreateEntry, { customer_id: '1', service_id: '2', time_since: '2026-03-31T09:00:00', time_until: '2026-03-31T10:00:00Z' }, /ISO-8601 date-time/],
    ['non-ISO date', aiCreateAbsence, { date_since: '03/31/2026', date_until: '2026-04-01', type: '1' }, /ISO-8601 date/],
    ['impossible date', aiCreateAbsence, { date_since: '2026-02-30', date_until: '2026-03-01', type: '1' }, /real calendar date/],
    ['end before start', aiCreateAbsence, { date_since: '2026-03-05', date_until: '2026-03-01', type: '1' }, /must not be before/],
    ['unknown type', aiCreateAbsence, { date_since: '2026-03-01', date_until: '2026-03-01', type: '99' }, /Type must be one of/],
    ['unknown yes/no', aiCreateCustomer, { name: 'A', active: 'true' }, /"yes" or "no"/],
    ['unknown color', aiCreateCustomer, { name: 'A', color: 'red' }, /Color must be one of/],
    ['unknown status', aiUpdateAbsence, { absence_id: '1', status: 'ok' }, /Status must be one of/],
    ['bad year', aiListAbsences, { year: '26' }, /four-digit year/],
    ['empty update', aiUpdateEntry, { entry_id: '1' }, /at least one field/],
  ])('rejects %s', async (_label, action, propsValue, pattern) => {
    await expect(runAction({ action, propsValue })).rejects.toThrow(pattern);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

type Runnable = { run: unknown };
