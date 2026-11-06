import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNote } from '../src/lib/actions/ai/create-note';
import { deleteActivity } from '../src/lib/actions/ai/delete-activity';
import { getActivity } from '../src/lib/actions/ai/get-activity';
import { listActivities } from '../src/lib/actions/ai/list-activities';
import { logCall } from '../src/lib/actions/ai/log-call';
import { logEmail } from '../src/lib/actions/ai/log-email';
import { sendSms } from '../src/lib/actions/ai/send-sms';
import { updateNote } from '../src/lib/actions/ai/update-note';

const auth = { secret_text: 'api_secret' };
const BASE = 'https://api.close.com/api/v1';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }) {
  return Reflect.apply(Reflect.get(action, 'run'), undefined, [{ auth, propsValue }]);
}

function mock(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  it.each([createNote, updateNote, logCall, logEmail, sendSms, listActivities, getActivity, deleteActivity])('$name is ai with schema', (a) => {
    expect(a.audience).toBe('ai');
    expect(a.outputSchema).toBeDefined();
    expect(a.aiMetadata?.description).toBeTruthy();
  });
  it('classifies by side effect', () => {
    expect(deleteActivity.classification).toBe('DESTRUCTIVE');
    expect(listActivities.classification).toBe('SEARCH');
    expect(sendSms.classification).toBe('WRITE');
    expect(sendSms.aiMetadata?.description).toMatch(/real SMS/);
  });
});

describe('notes', () => {
  it('creates a note', async () => {
    const spy = mock({ id: 'acti_1', _type: 'Note', note: 'hi', lead_id: 'lead_1' });
    const out = await run({ action: createNote, propsValue: { leadId: ' lead_1 ', note: 'hi' } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe(`${BASE}/activity/note/`);
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.body).toEqual({ lead_id: 'lead_1', note: 'hi' });
    expect(out).toMatchObject({ id: 'acti_1', type: 'Note', text: 'hi', leadId: 'lead_1' });
  });
  it('rejects a bad lead id', async () => {
    await expect(run({ action: createNote, propsValue: { leadId: 'cont_1', note: 'x' } })).rejects.toThrow('lead_');
  });
  it('updates a note', async () => {
    const spy = mock({ id: 'acti_1', note: 'new' });
    await run({ action: updateNote, propsValue: { noteId: 'acti_1', note: 'new' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ url: `${BASE}/activity/note/acti_1/`, method: HttpMethod.PUT, body: { note: 'new' } });
  });
});

describe('logging', () => {
  it('logs a completed call', async () => {
    const spy = mock({ id: 'acti_2', _type: 'Call', duration: 60 });
    const out = await run({ action: logCall, propsValue: { leadId: 'lead_1', direction: 'inbound', durationSeconds: 60, phone: '+16505551234' } });
    expect(spy.mock.calls[0][0].body).toEqual({ lead_id: 'lead_1', status: 'completed', direction: 'inbound', duration: 60, phone: '+16505551234' });
    expect(out).toMatchObject({ durationSeconds: 60 });
  });
  it('rejects a negative duration', async () => {
    await expect(run({ action: logCall, propsValue: { leadId: 'lead_1', durationSeconds: -1 } })).rejects.toThrow('whole number');
  });
  it('logs a sent email with status sent', async () => {
    const spy = mock({ id: 'acti_3', _type: 'Email' });
    await run({ action: logEmail, propsValue: { leadId: 'lead_1', direction: 'sent', subject: 'S', bodyText: 'B', to: ['a@b.com'] } });
    expect(spy.mock.calls[0][0].body).toEqual({ lead_id: 'lead_1', status: 'sent', subject: 'S', body_text: 'B', to: ['a@b.com'] });
  });
  it('logs a received email with status inbox and requires sender', async () => {
    await expect(run({ action: logEmail, propsValue: { leadId: 'lead_1', direction: 'received', subject: 'S', bodyText: 'B' } })).rejects.toThrow('Sender');
    const spy = mock({ id: 'acti_4' });
    await run({ action: logEmail, propsValue: { leadId: 'lead_1', direction: 'received', subject: 'S', bodyText: 'B', sender: 'x@y.com' } });
    expect(spy.mock.calls[0][0].body).toMatchObject({ status: 'inbox', sender: 'x@y.com' });
  });
});

describe('sms', () => {
  it('sends with status outbox', async () => {
    const spy = mock({ id: 'acti_5', _type: 'SMS', status: 'outbox', text: 'yo', remote_phone: '+15555550100' });
    const out = await run({ action: sendSms, propsValue: { leadId: 'lead_1', localPhone: '+1 (650) 555-1234', remotePhone: '+15555550100', text: 'yo' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/activity/sms/`);
    expect(spy.mock.calls[0][0].body).toEqual({ lead_id: 'lead_1', status: 'outbox', direction: 'outbound', local_phone: '+16505551234', remote_phone: '+15555550100', text: 'yo' });
    expect(out).toMatchObject({ status: 'outbox', phone: '+15555550100' });
  });
  it('rejects non-E.164 numbers before sending', async () => {
    const spy = mock({});
    await expect(run({ action: sendSms, propsValue: { leadId: 'lead_1', localPhone: '6505551234', remotePhone: '+15555550100', text: 'x' } })).rejects.toThrow('E.164');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('read and delete', () => {
  it('lists activities for a lead with type filter', async () => {
    const spy = mock({ data: [{ id: 'acti_1', _type: 'Call' }], has_more: true });
    const out = await run({ action: listActivities, propsValue: { leadId: 'lead_1', type: 'call', limit: 10 } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/activity/`);
    expect(spy.mock.calls[0][0].queryParams).toEqual({ lead_id: 'lead_1', _type: 'Call', _limit: '10', _skip: '0' });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextSkip: 1 });
  });
  it('refuses type filter without lead', async () => {
    await expect(run({ action: listActivities, propsValue: { type: 'note' } })).rejects.toThrow('Lead ID');
  });
  it('gets an sms by type', async () => {
    const spy = mock({ id: 'acti_9', _type: 'SMS' });
    await run({ action: getActivity, propsValue: { activityType: 'sms', activityId: 'acti_9' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/activity/sms/acti_9/`);
  });
  it('rejects unknown types', async () => {
    await expect(run({ action: getActivity, propsValue: { activityType: 'task', activityId: 'acti_9' } })).rejects.toThrow('Activity Type');
  });
  it('deletes a call', async () => {
    const spy = mock({});
    const out = await run({ action: deleteActivity, propsValue: { activityType: 'call', activityId: 'acti_2' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ url: `${BASE}/activity/call/acti_2/`, method: HttpMethod.DELETE });
    expect(out).toEqual({ deleted: true, id: 'acti_2' });
  });
  it('surfaces a 404 on delete', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(Object.assign(new Error('http'), { response: { status: 404, body: { error: 'Not found' }, headers: {} } }));
    await expect(run({ action: deleteActivity, propsValue: { activityType: 'note', activityId: 'acti_2' } })).rejects.toThrow('404');
  });
});
