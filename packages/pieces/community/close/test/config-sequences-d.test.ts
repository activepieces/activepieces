import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from '../src/lib/actions/ai/get-current-user';
import { listUsers } from '../src/lib/actions/ai/list-users';
import { listLeadStatuses } from '../src/lib/actions/ai/list-lead-statuses';
import { listPipelines } from '../src/lib/actions/ai/list-pipelines';
import { listCustomFields } from '../src/lib/actions/ai/list-custom-fields';
import { listCustomActivityTypes } from '../src/lib/actions/ai/list-custom-activity-types';
import { listSmartViews } from '../src/lib/actions/ai/list-smart-views';
import { listSequences } from '../src/lib/actions/ai/list-sequences';
import { subscribeContactToSequence } from '../src/lib/actions/ai/subscribe-contact-to-sequence';
import { listSequenceSubscriptions } from '../src/lib/actions/ai/list-sequence-subscriptions';
import { pauseSequenceSubscription } from '../src/lib/actions/ai/pause-sequence-subscription';

const auth = { secret_text: 'api_secret' };

const all = [
  getCurrentUser,
  listUsers,
  listLeadStatuses,
  listPipelines,
  listCustomFields,
  listCustomActivityTypes,
  listSmartViews,
  listSequences,
  subscribeContactToSequence,
  listSequenceSubscriptions,
  pauseSequenceSubscription,
];

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  return spy;
}

function run({ action, propsValue = {} }: { action: (typeof all)[number]; propsValue?: Record<string, unknown> }) {
  return Reflect.apply(action.run, undefined, [{ auth, propsValue }]);
}

function sent(spy: ReturnType<typeof mockSeq>) {
  return spy.mock.calls[0][0];
}

const subscription = {
  id: 'sub_1',
  sequence_id: 'seq_1',
  contact_id: 'cont_1',
  lead_id: 'lead_1',
  contact_email: 'c@example.org',
  sender_account_id: 'emailacct_1',
  sender_name: 'John',
  sender_email: 'john@example.com',
  status: 'active',
  status_reason: null,
  calls_assigned_to: ['user_1'],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('group D metadata', () => {
  it('all are ai actions with outputSchema, aiMetadata and unique names', () => {
    const names = new Set<string>();
    for (const a of all) {
      expect(a.audience, a.name).toBe('ai');
      expect(a.outputSchema, a.name).toBeDefined();
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
      expect(names.has(a.name)).toBe(false);
      names.add(a.name);
    }
    expect(names.size).toBe(11);
  });
  it('classifications match side effects', () => {
    expect(getCurrentUser.classification).toBe('READ');
    expect(subscribeContactToSequence.classification).toBe('WRITE');
    expect(pauseSequenceSubscription.classification).toBe('WRITE');
    for (const a of [listUsers, listLeadStatuses, listPipelines, listCustomFields, listCustomActivityTypes, listSmartViews, listSequences, listSequenceSubscriptions]) {
      expect(a.classification, a.name).toBe('SEARCH');
    }
  });
});

describe('get_current_user', () => {
  it('requests only safe fields and never returns keys', async () => {
    const spy = mockSeq({
      id: 'user_1',
      email: 'a@close.com',
      first_name: 'Ann',
      last_name: 'Lee',
      organizations: [{ id: 'orga_1' }],
      api_key: 'secret_should_not_leak',
      email_accounts: [{ id: 'emailacct_1', _type: 'google', identities: [{ email: 'a@close.com', name: 'Ann' }], oauth_token: 'tok' }],
    });
    const out = await run({ action: getCurrentUser });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/me/');
    expect(sent(spy).queryParams?._fields).toBe('id,email,first_name,last_name,organizations,date_created,email_accounts');
    expect(out).toMatchObject({ id: 'user_1', name: 'Ann Lee', organizationIds: ['orga_1'], emailAccounts: [{ id: 'emailacct_1', type: 'google', emails: ['a@close.com'] }] });
    expect(JSON.stringify(out)).not.toMatch(/secret_should_not_leak|tok"/);
  });
});

describe('list actions', () => {
  it('list_users pages with limit and skip', async () => {
    const spy = mockSeq({ data: [{ id: 'user_1', first_name: 'A' }], has_more: true });
    const out = await run({ action: listUsers, propsValue: { limit: 1, skip: 5 } });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/user/');
    expect(sent(spy).queryParams).toMatchObject({ _limit: '1', _skip: '5' });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextSkip: 6 });
  });
  it('list_users rejects a bad limit', async () => {
    await expect(run({ action: listUsers, propsValue: { limit: 500 } })).rejects.toThrow(/Limit/);
  });
  it('list_lead_statuses', async () => {
    const spy = mockSeq({ data: [{ id: 'stat_1', label: 'Potential' }], has_more: false });
    const out = await run({ action: listLeadStatuses });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/status/lead/');
    expect(out).toMatchObject({ items: [{ id: 'stat_1', label: 'Potential' }], hasMore: false });
  });
  it('list_pipelines maps statuses', async () => {
    mockSeq({ data: [{ id: 'pipe_1', name: 'Sales', statuses: [{ id: 'stat_w', label: 'Won', type: 'won' }] }], has_more: false });
    const out = await run({ action: listPipelines });
    expect(out).toMatchObject({ items: [{ id: 'pipe_1', statuses: [{ id: 'stat_w', type: 'won' }] }] });
  });
  it('list_custom_fields uses the object type path and validates it', async () => {
    const spy = mockSeq({ data: [{ id: 'cf_1', name: 'Owner', type: 'user', choices: ['a'] }], has_more: false });
    const out = await run({ action: listCustomFields, propsValue: { objectType: 'opportunity' } });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/custom_field/opportunity/');
    expect(out).toMatchObject({ items: [{ id: 'cf_1', choices: ['a'] }] });
    await expect(run({ action: listCustomFields, propsValue: { objectType: '../x' } })).rejects.toThrow(/Object Type/);
  });
  it('list_custom_activity_types handles a response without has_more', async () => {
    const spy = mockSeq({ data: [{ id: 'actitype_1', name: 'Signup', fields: [{ id: 'cf_1', name: 'Email', required: true }] }] });
    const out = await run({ action: listCustomActivityTypes });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/custom_activity/');
    expect(out).toMatchObject({ count: 1, items: [{ id: 'actitype_1', fields: [{ id: 'cf_1', required: true }] }] });
  });
  it('list_smart_views defaults type to lead', async () => {
    const spy = mockSeq({ data: [{ id: 'save_1', name: 'All Leads', type: 'lead', is_shared: true }], has_more: false });
    const out = await run({ action: listSmartViews });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/saved_search/');
    expect(sent(spy).queryParams).toMatchObject({ type: 'lead' });
    expect(out).toMatchObject({ items: [{ id: 'save_1', isShared: true }] });
  });
  it('list_sequences maps steps', async () => {
    const spy = mockSeq({ data: [{ id: 'seq_1', name: 'S', status: 'active', steps: [{ id: 'seqstep_1', step_type: 'email', delay: 86400 }] }], has_more: false });
    const out = await run({ action: listSequences });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/sequence/');
    expect(out).toMatchObject({ items: [{ id: 'seq_1', stepCount: 1, steps: [{ stepType: 'email', delaySeconds: 86400 }] }] });
  });
});

describe('sequence subscriptions', () => {
  const subscribeProps = {
    sequenceId: 'seq_1',
    contactId: 'cont_1',
    contactEmail: 'c@example.org',
    senderAccountId: 'emailacct_1',
    senderName: 'John',
    senderEmail: 'john@example.com',
    callsAssignedTo: ['user_1'],
  };
  it('subscribe posts the documented body', async () => {
    const spy = mockSeq(subscription);
    const out = await run({ action: subscribeContactToSequence, propsValue: subscribeProps });
    expect(sent(spy).method).toBe(HttpMethod.POST);
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/sequence_subscription/');
    expect(sent(spy).body).toEqual({
      sequence_id: 'seq_1',
      contact_id: 'cont_1',
      contact_email: 'c@example.org',
      sender_account_id: 'emailacct_1',
      sender_name: 'John',
      sender_email: 'john@example.com',
      calls_assigned_to: ['user_1'],
    });
    expect(out).toMatchObject({ id: 'sub_1', status: 'active', callsAssignedTo: ['user_1'] });
  });
  it('subscribe validates IDs and emails before calling Close', async () => {
    const spy = mockSeq(subscription);
    await expect(run({ action: subscribeContactToSequence, propsValue: { ...subscribeProps, sequenceId: 'cont_1' } })).rejects.toThrow(/seq_/);
    await expect(run({ action: subscribeContactToSequence, propsValue: { ...subscribeProps, senderEmail: 'nope' } })).rejects.toThrow(/email/);
    expect(spy).not.toHaveBeenCalled();
  });
  it('list subscriptions requires a filter', async () => {
    const spy = mockSeq({ data: [], has_more: false });
    await expect(run({ action: listSequenceSubscriptions })).rejects.toThrow(/at least one/);
    expect(spy).not.toHaveBeenCalled();
  });
  it('list subscriptions filters by contact', async () => {
    const spy = mockSeq({ data: [subscription], has_more: false });
    const out = await run({ action: listSequenceSubscriptions, propsValue: { contactId: 'cont_1' } });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/sequence_subscription/');
    expect(sent(spy).queryParams).toMatchObject({ contact_id: 'cont_1' });
    expect(sent(spy).queryParams?.sequence_id).toBeUndefined();
    expect(out).toMatchObject({ count: 1, items: [{ id: 'sub_1' }] });
  });
  it('pause sends PUT status paused', async () => {
    const spy = mockSeq({ ...subscription, status: 'paused', status_reason: 'manual' });
    const out = await run({ action: pauseSequenceSubscription, propsValue: { subscriptionId: 'sub_1' } });
    expect(sent(spy).method).toBe(HttpMethod.PUT);
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/sequence_subscription/sub_1/');
    expect(sent(spy).body).toEqual({ status: 'paused' });
    expect(out).toMatchObject({ status: 'paused', statusReason: 'manual' });
  });
  it('pause rejects a non-subscription ID', async () => {
    await expect(run({ action: pauseSequenceSubscription, propsValue: { subscriptionId: '../x' } })).rejects.toThrow(/Subscription ID/);
  });
});
