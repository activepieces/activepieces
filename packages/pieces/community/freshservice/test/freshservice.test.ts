import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { freshservice, freshserviceAuth } from '../src';
import { freshserviceApiCall, MAX_POLL_PAGES, normalizeDomain } from '../src/lib/common/client';
import { updatedTicket } from '../src/lib/triggers/updated-ticket';
import { newTicket } from '../src/lib/triggers/new-ticket';
import { newChange } from '../src/lib/triggers/new-change';
import { newRequester } from '../src/lib/triggers/new-requester';
import { updatedRequester } from '../src/lib/triggers/updated-requester';
import { aiFindRequester } from '../src/lib/actions/ai/ai-find-requester';
import { updatedChange } from '../src/lib/triggers/updated-change';
import { aiSearchTickets } from '../src/lib/actions/ai/ai-search-tickets';
import { aiCreateTicket } from '../src/lib/actions/ai/ai-create-ticket';
import { aiCreateRequester } from '../src/lib/actions/ai/ai-create-requester';
import { aiUpdateTicket } from '../src/lib/actions/ai/ai-update-ticket';
import { aiCreateChange } from '../src/lib/actions/ai/ai-create-change';
import { aiUpdateChange } from '../src/lib/actions/ai/ai-update-change';
import { aiCreateChangeTask } from '../src/lib/actions/ai/ai-create-change-task';
import { aiUpdateChangeTask } from '../src/lib/actions/ai/ai-update-change-task';
import { aiDeleteChange } from '../src/lib/actions/ai/ai-delete-change';
import { createChange } from '../src/lib/actions/create-change';
import { aiRequestTicketApproval } from '../src/lib/actions/ai/ai-request-ticket-approval';
import { requestTicketApproval } from '../src/lib/actions/request-ticket-approval';

const auth = { type: 'CUSTOM_AUTH', props: { domain: 'https://Acme.freshservice.com/', api_key: 'key' } };

function okResponse(body: unknown) {
  return { status: 200, headers: {}, body };
}

function makeStore(initial: Record<string, unknown>) {
  const data: Record<string, unknown> = { ...initial };
  return {
    get: async (key: string) => data[key] ?? null,
    put: async (key: string, value: unknown) => {
      data[key] = value;
      return value;
    },
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeDomain', () => {
  it.each([
    ['acme', 'acme'],
    ['acme.freshservice.com', 'acme'],
    ['https://acme.freshservice.com/', 'acme'],
    [' HTTPS://Acme.Freshservice.com/a/tickets?x=1 ', 'acme'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });
});

describe('freshserviceApiCall', () => {
  it('builds the URL from a normalised domain', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ ticket: { id: 1 } }));
    await freshserviceApiCall({ method: 'GET', endpoint: 'tickets/1', auth });
    expect(spy.mock.calls[0][0].url).toBe('https://acme.freshservice.com/api/v2/tickets/1');
  });

  it('keeps the Freshservice message, status and responseBody without double punctuation', async () => {
    const vendorBody = {
      description: 'Validation failed.',
      errors: [{ field: 'email', message: 'It should be a valid email address.', code: 'invalid_value' }],
    };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 400, responseBody: vendorBody }));
    const error = await freshserviceApiCall({ method: 'POST', endpoint: 'tickets', auth }).catch((e: unknown) => e);
    expect(error).toMatchObject({
      message: 'Freshservice request failed with status 400: Validation failed; email: It should be a valid email address',
      status: 400,
      responseBody: vendorBody,
    });
    expect(Object.keys(Object(error))).not.toContain('body');
  });
});

describe('auth validate', () => {
  it('surfaces the real 401 message', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 401, responseBody: { code: 'access_denied', message: 'You are not authorized to perform this action.' } })
    );
    const result = await freshserviceAuth.validate?.({ auth: { domain: 'acme', api_key: 'bad' }, server: { apiUrl: '', publicUrl: '' } });
    expect(result).toEqual({
      valid: false,
      error:
        'Freshservice request failed with status 401: You are not authorized to perform this action. Check the API key from your Freshservice Profile Settings',
    });
  });
});

describe('triggers', () => {
  it('new ticket reads newest first and stops at the first page that reaches lastPoll', async () => {
    const lastPoll = Date.parse('2026-10-01T00:00:00Z');
    const rows = ({ count, newestOffset }: { count: number; newestOffset: number }) =>
      Array.from({ length: count }, (_, i) => ({
        id: newestOffset - i,
        created_at: new Date(lastPoll + (newestOffset - i) * 1000).toISOString(),
        updated_at: new Date(lastPoll + 500000).toISOString(),
      }));
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(okResponse({ tickets: rows({ count: 100, newestOffset: 150 }) }))
      .mockResolvedValueOnce(okResponse({ tickets: rows({ count: 100, newestOffset: 50 }) }))
      .mockResolvedValueOnce(okResponse({ tickets: rows({ count: 100, newestOffset: -50 }) }));
    const result = await newTicket.run({ auth, propsValue: {}, store: makeStore({ lastPoll }), files: {} });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(150);
    expect(spy.mock.calls[0][0].queryParams).toMatchObject({
      updated_since: '2026-10-01T00:00:00.000Z',
      order_type: 'desc',
      page: '1',
      per_page: '100',
    });
    expect(spy.mock.calls[1][0].queryParams).toMatchObject({ page: '2' });
  });

  it('new ticket keeps reading when a full page is not sorted newest first', async () => {
    const lastPoll = Date.parse('2026-10-01T00:00:00Z');
    const oldestFirst = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      created_at: new Date(lastPoll + (i - 10) * 1000).toISOString(),
      updated_at: new Date(lastPoll + 500000).toISOString(),
    }));
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(okResponse({ tickets: oldestFirst }))
      .mockResolvedValueOnce(okResponse({ tickets: [] }));
    await newTicket.run({ auth, propsValue: {}, store: makeStore({ lastPoll }), files: {} });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('new change asks for newest first by created_at and stops once a page reaches lastPoll', async () => {
    const lastPoll = Date.parse('2026-10-01T00:00:00Z');
    const changes = Array.from({ length: 100 }, (_, i) => ({
      id: 100 - i,
      created_at: new Date(lastPoll + (5 - i) * 1000).toISOString(),
      updated_at: new Date(lastPoll + 500000).toISOString(),
    }));
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ changes }));
    const result = await newChange.run({ auth, propsValue: {}, store: makeStore({ lastPoll }), files: {} });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(5);
    expect(spy.mock.calls[0][0].queryParams).toMatchObject({ order_by: 'created_at', order_type: 'desc' });
  });

  it.each([
    ['new requester', newRequester, 'created_at'],
    ['updated requester', updatedRequester, 'updated_at'],
  ])('%s reads past a full filter page of 30 from the date of lastPoll', async (_name, trigger, field) => {
    const lastPoll = Date.parse('2026-10-01T05:00:00Z');
    const rows = ({ count, offset }: { count: number; offset: number }) =>
      Array.from({ length: count }, (_, i) => ({
        id: offset + i,
        [field]: new Date(lastPoll + (offset + i + 1) * 1000).toISOString(),
      }));
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(okResponse({ requesters: rows({ count: 30, offset: 0 }) }))
      .mockResolvedValueOnce(okResponse({ requesters: rows({ count: 4, offset: 30 }) }));
    const result = await trigger.run({ auth, propsValue: {}, store: makeStore({ lastPoll }), files: {} });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(34);
    expect(spy.mock.calls[0][0].queryParams).toMatchObject({
      query: `"${field}:>'2026-10-01'"`,
      per_page: '30',
      page: '1',
    });
    expect(spy.mock.calls[1][0].queryParams).toMatchObject({ page: '2' });
  });

  it('updated ticket requests oldest-first and returns every record when the last page is short', async () => {
    const lastPoll = Date.parse('2026-10-01T00:00:00Z');
    const rows = (count: number, offset: number) =>
      Array.from({ length: count }, (_, i) => ({ id: offset + i, updated_at: new Date(lastPoll + (offset + i + 1) * 1000).toISOString() }));
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(okResponse({ tickets: rows(100, 0) }))
      .mockResolvedValueOnce(okResponse({ tickets: rows(100, 100) }))
      .mockResolvedValueOnce(okResponse({ tickets: rows(7, 200) }));
    const result = await updatedTicket.run({ auth, propsValue: {}, store: makeStore({ lastPoll }), files: {} });
    expect(result).toHaveLength(207);
    expect(spy).toHaveBeenCalledTimes(3);
    for (const call of spy.mock.calls) {
      expect(call[0].queryParams).toMatchObject({ order_type: 'asc', updated_since: '2026-10-01T00:00:00.000Z' });
    }
  });

  it('throws instead of emitting a partial set when the page cap is hit with a full last page', async () => {
    const lastPoll = Date.parse('2026-10-01T00:00:00Z');
    const store = makeStore({ lastPoll });
    let n = 0;
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () =>
      okResponse({
        tickets: Array.from({ length: 100 }, () => ({ id: ++n, updated_at: new Date(lastPoll + n * 1000).toISOString() })),
      }) as never
    );
    await expect(updatedTicket.run({ auth, propsValue: {}, store, files: {} })).rejects.toThrow(
      /More than 20000 Freshservice records changed since the last poll/
    );
    expect(spy).toHaveBeenCalledTimes(MAX_POLL_PAGES);
    expect(await store.get('lastPoll')).toBe(lastPoll);
  });

  it('rethrows API errors instead of returning nothing', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 429, responseBody: { message: 'Rate limit' } }));
    await expect(
      updatedChange.run({ auth, propsValue: {}, store: makeStore({ lastPoll: 1 }), files: {} })
    ).rejects.toMatchObject({ status: 429 });
  });
});

describe('ai actions', () => {
  it('registers 21 ai actions, 11 human actions and no both actions', () => {
    const actions = Object.values(freshservice.actions());
    expect(actions.filter((a) => a.audience === 'ai')).toHaveLength(21);
    expect(actions.filter((a) => a.audience === 'both')).toHaveLength(0);
    expect(actions.filter((a) => a.audience === 'human' && a.name !== 'custom_api_call')).toHaveLength(11);
    const aiNames = actions.filter((a) => a.audience === 'ai').map((a) => a.name);
    expect(new Set(aiNames).size).toBe(aiNames.length);
    expect(freshservice.minimumSupportedRelease).toBe('0.86.4');
  });

  it('every action except custom api call and every trigger has an outputSchema', () => {
    const missing = [
      ...Object.values(freshservice.actions()).filter((a) => a.name !== 'custom_api_call' && !a.outputSchema),
      ...Object.values(freshservice.triggers()).filter((t) => !t.outputSchema),
    ].map((s) => s.name);
    expect(missing).toEqual([]);
  });

  it('search tickets quotes the filter query and reports has_more from total', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue(okResponse({ tickets: Array.from({ length: 30 }, (_, i) => ({ id: i })), total: 45 }));
    const result = await aiSearchTickets.run({ auth, propsValue: { query: 'status:2 AND priority:4' } });
    expect(spy.mock.calls[0][0].url).toBe('https://acme.freshservice.com/api/v2/tickets/filter');
    expect(spy.mock.calls[0][0].queryParams).toEqual({ query: '"status:2 AND priority:4"', page: '1' });
    expect(result).toMatchObject({ page: 1, has_more: true, total: 45 });
  });

  it('find requester ignores per_page with a filter query and reports has_more from the fixed page of 30', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue(okResponse({ requesters: Array.from({ length: 30 }, (_, i) => ({ id: i })) }));
    const result = await aiFindRequester.run({ auth, propsValue: { query: "job_title:'Engineer'", per_page: 50 } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ page: '1', query: `"job_title:'Engineer'"` });
    expect(result).toMatchObject({ page: 1, has_more: true });
    const lastPage = await aiFindRequester.run({ auth, propsValue: { query: "job_title:'Engineer'", page: 40 } });
    expect(lastPage).toMatchObject({ page: 40, has_more: false });
  });

  it('create ticket documents the Freshservice source codes, not the Freshdesk ones', () => {
    expect(aiCreateTicket.props.source.description).toContain('4 Chat, 5 Feedback Widget');
    expect(aiCreateTicket.props.source.description).not.toContain('Outbound Email');
  });

  it('create ticket requires a requester and sends email when no id', async () => {
    await expect(aiCreateTicket.run({ auth, propsValue: { subject: 's', description: 'd' } })).rejects.toThrow(
      'Provide either Requester ID or Requester Email.'
    );
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ ticket: { id: 9 } }));
    await aiCreateTicket.run({ auth, propsValue: { subject: 's', description: 'd', email: 'a@b.co' } });
    expect(spy.mock.calls[0][0].body).toEqual({ subject: 's', description: 'd', email: 'a@b.co', status: 2, priority: 1 });
  });
});

describe('request bodies', () => {
  it.each([
    ['ai_create_requester', aiCreateRequester, { first_name: 'A', primary_email: 'a@b.co' }],
    ['ai_update_ticket', aiUpdateTicket, { ticket_id: 1, status: 3 }],
    ['ai_create_change', aiCreateChange, { subject: 's', description: 'd', requester_id: 1, planned_start_date: '2026-11-03T09:00:00Z', planned_end_date: '2026-11-03T10:00:00Z' }],
    ['ai_update_change', aiUpdateChange, { change_id: 1, subject: 'x' }],
    ['ai_create_change_task', aiCreateChangeTask, { change_id: 1, title: 't' }],
    ['ai_update_change_task', aiUpdateChangeTask, { change_id: 1, task_id: 2, title: 't' }],
  ])('%s never sends auth or path ids in the body', async (_name, action, props) => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({}));
    await action.run({ auth, propsValue: { ...props, auth } });
    const body = spy.mock.calls[0][0].body;
    expect(body).not.toHaveProperty('auth');
    expect(body).not.toHaveProperty('change_id');
    expect(body).not.toHaveProperty('ticket_id');
    expect(body).not.toHaveProperty('task_id');
  });

  it('human create change leaves the planned dates check to Freshservice', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ change: { id: 3 } }));
    const result = await createChange.run({ auth, propsValue: { subject: 's', requester_id: 1 } });
    expect(result).toEqual({ id: 3 });
    expect(spy.mock.calls[0][0].body).toEqual({ subject: 's', requester_id: 1 });
  });

  it('repeat delete maps 404 to a clear message and keeps status and responseBody', async () => {
    const vendorBody = { message: 'Record not found.' };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 404, responseBody: vendorBody }));
    await expect(aiDeleteChange.run({ auth, propsValue: { change_id: 5 } })).rejects.toMatchObject({
      message: 'The change was not found; it may already be deleted (status 404: Record not found)',
      status: 404,
      responseBody: vendorBody,
    });
  });

  it('ai create change asks for planned dates before calling Freshservice', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      aiCreateChange.run({ auth, propsValue: { subject: 's', description: 'd', requester_id: 1 } })
    ).rejects.toThrow('planned_start_date and planned_end_date');
    expect(spy).not.toHaveBeenCalled();
  });

  it('repeat delete on a trashed change (405) says already deleted without the raw method text', async () => {
    const vendorBody = { message: 'DELETE method is not allowed. It should be one of these method(s): GET' };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 405, responseBody: vendorBody }));
    const error = await aiDeleteChange.run({ auth, propsValue: { change_id: 5 } }).catch((e: unknown) => e);
    expect(error).toMatchObject({
      message: 'The change is already deleted (it is in the Freshservice trash) (status 405)',
      status: 405,
      responseBody: vendorBody,
    });
  });

  it.each([
    ['all', 1],
    ['any', 2],
    ['majority', 3],
    ['first_responder', 4],
  ])('ai request approval sends a single approver_id with type %s -> %d', async (type, code) => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ approval: { id: 1 } }));
    await aiRequestTicketApproval.run({ auth, propsValue: { ticket_id: 5, approver_id: 7, approval_type: type } });
    expect(spy.mock.calls[0][0].url).toBe('https://acme.freshservice.com/api/v2/tickets/5/approvals');
    expect(spy.mock.calls[0][0].body).toEqual({ approver_id: 7, approval_type: code });
  });

  it('human request approval sends approver_id, not approver_ids', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(okResponse({ approval: { id: 1 } }));
    await requestTicketApproval.run({ auth, propsValue: { ticket_id: 5, approver_id: 7 } });
    expect(spy.mock.calls[0][0].body).toEqual({ approver_id: 7, approval_type: 2 });
  });
});
