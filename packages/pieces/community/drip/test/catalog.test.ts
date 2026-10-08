import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { applyTagAction } from '../src/lib/actions/ai/apply-tag.action';
import { subscribeToCampaignAction } from '../src/lib/actions/ai/subscribe-to-campaign.action';
import { getBroadcastAction } from '../src/lib/actions/get-broadcast.action';
import { getCampaignAction } from '../src/lib/actions/get-campaign.action';
import { getConversionAction } from '../src/lib/actions/get-conversion.action';
import { getCurrentUserAction } from '../src/lib/actions/get-current-user.action';
import { getFormAction } from '../src/lib/actions/get-form.action';
import { getWorkflowAction } from '../src/lib/actions/get-workflow.action';
import { listAccountsAction } from '../src/lib/actions/list-accounts.action';
import { listBroadcastsAction } from '../src/lib/actions/list-broadcasts.action';
import { listCampaignSubscribersAction } from '../src/lib/actions/list-campaign-subscribers.action';
import { listCampaignsAction } from '../src/lib/actions/list-campaigns.action';
import { listConversionsAction } from '../src/lib/actions/list-conversions.action';
import { listCustomFieldsAction } from '../src/lib/actions/list-custom-fields.action';
import { listEventActionsAction } from '../src/lib/actions/list-event-actions.action';
import { listFormsAction } from '../src/lib/actions/list-forms.action';
import { listTagsAction } from '../src/lib/actions/list-tags.action';
import { listWorkflowsAction } from '../src/lib/actions/list-workflows.action';
import { removeFromWorkflowAction } from '../src/lib/actions/remove-from-workflow.action';
import { removeTagAction } from '../src/lib/actions/remove-tag.action';
import { startWorkflowAction } from '../src/lib/actions/start-workflow.action';
import { run, stubFetch } from './helpers';

const A = '4617837';
const SUB = { id: 'z1tog', email: 'odai+aptest-1@activepieces.com', tags: ['Customer'] };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('account-level reads', () => {
  test('list accounts and current user', async () => {
    stubFetch((request) => (request.path === '/accounts' ? { body: { accounts: [{ id: A, name: 'a' }] } } : { body: { users: [{ email: 'o@a.com', name: 'O', time_zone: 'Etc/UTC' }] } }));
    await expect(run(listAccountsAction)({})).resolves.toEqual({ items: [{ id: A, name: 'a' }] });
    await expect(run(getCurrentUserAction)({})).resolves.toEqual({ email: 'o@a.com', name: 'O', time_zone: 'Etc/UTC' });
  });
  test('tags, custom fields, forms and event names', async () => {
    stubFetch((request) => {
      if (request.path.endsWith('/tags')) return { body: { tags: ['a', 'b'] } };
      if (request.path.endsWith('/custom_field_identifiers')) return { body: { custom_field_identifiers: ['shirt_size'] } };
      if (request.path.endsWith('/forms')) return { body: { forms: [{ id: '7', headline: 'H' }] } };
      return { body: { event_actions: ['Logged in'], meta: { total_pages: 2, total_count: 2 } } };
    });
    await expect(run(listTagsAction)({ accountId: A })).resolves.toEqual({ items: ['a', 'b'] });
    await expect(run(listCustomFieldsAction)({ accountId: A })).resolves.toEqual({ items: ['shirt_size'] });
    await expect(run(listFormsAction)({ accountId: A })).resolves.toEqual({ items: [{ id: '7', headline: 'H' }] });
    await expect(run(listEventActionsAction)({ accountId: A, perPage: 1 })).resolves.toEqual({ items: ['Logged in'], page: 1, totalPages: 2, totalCount: 2, hasMore: true });
  });
  test.each([
    [listCampaignsAction, 'campaigns', 'campaigns'],
    [listWorkflowsAction, 'workflows', 'workflows'],
    [listBroadcastsAction, 'broadcasts', 'broadcasts'],
    [listConversionsAction, 'goals', 'goals'],
  ])('%#: list pages pass status, page and per_page', async (action, resource, key) => {
    const seen = stubFetch(() => ({ body: { [key]: [{ id: '1', name: 'n' }], meta: { page: 1 } } }));
    const result = await run(action)({ accountId: A, status: 'all', perPage: 1 });
    expect(seen[0].path).toBe(`/${A}/${resource}`);
    expect(Object.fromEntries(seen[0].query)).toEqual({ status: 'all', page: '1', per_page: '1' });
    expect(result).toEqual({ items: [{ id: '1', name: 'n' }], page: 1, totalPages: null, totalCount: null, hasMore: true });
  });
  test('broadcasts allow at most 100 per page', async () => {
    stubFetch(() => ({ body: {} }));
    await expect(run(listBroadcastsAction)({ accountId: A, perPage: 101 })).rejects.toThrow('between 1 and 100');
  });
  test.each([
    [getCampaignAction, 'campaigns'],
    [getWorkflowAction, 'workflows'],
    [getBroadcastAction, 'broadcasts'],
    [getConversionAction, 'goals'],
    [getFormAction, 'forms'],
  ])('%#: get by numeric ID unwraps the single record', async (action, key) => {
    const seen = stubFetch(() => ({ body: { [key]: [{ id: '55', name: 'x' }] } }));
    await expect(run(action)({ accountId: A, id: ' 55 ' })).resolves.toEqual({ id: '55', name: 'x' });
    expect(seen[0].path).toBe(`/${A}/${key}/55`);
    await expect(run(action)({ accountId: A, id: '../55' })).rejects.toThrow('digits only');
  });
  test('campaign subscribers filter by subscription status', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB], meta: { total_pages: 1, total_count: 1 } } }));
    await run(listCampaignSubscribersAction)({ accountId: A, campaignId: '9', status: 'removed' });
    expect(seen[0].path).toBe(`/${A}/campaigns/9/subscribers`);
    expect(seen[0].query.get('status')).toBe('removed');
  });
});

describe('tags', () => {
  test('apply_tag posts one email/tag pair', async () => {
    const seen = stubFetch(() => ({ status: 201, body: {} }));
    await expect(run(applyTagAction)({ accountId: A, email: SUB.email, tag: ' VIP ' })).resolves.toEqual({ email: SUB.email, tag: 'VIP', applied: true });
    expect(seen[0].body).toEqual({ tags: [{ email: SUB.email, tag: 'VIP' }] });
  });
  test('remove_tag looks the subscriber up, deletes the encoded tag and reports wasApplied', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: { subscribers: [SUB] } } : { status: 204 }));
    await expect(run(removeTagAction)({ accountId: A, subscriber: SUB.email, tag: 'customer' })).resolves.toEqual({ subscriberId: 'z1tog', email: SUB.email, tag: 'customer', wasApplied: true, removed: true });
    expect(seen[1].method).toBe('DELETE');
    expect(seen[1].path).toBe(`/${A}/subscribers/odai%2Baptest-1%40activepieces.com/tags/customer`);
    await run(removeTagAction)({ accountId: A, subscriber: SUB.email, tag: 'Big / Spender' });
    expect(seen[3].url).toContain('/tags/Big%20%2F%20Spender');
  });
  test('remove_tag fails when there is no such subscriber (Drip would silently 204)', async () => {
    const seen = stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'not found' }] } }));
    await expect(run(removeTagAction)({ accountId: A, subscriber: 'nobody@x.co', tag: 'a' })).rejects.toThrow('404');
    expect(seen).toHaveLength(1);
  });
});

describe('email series and workflows', () => {
  test('subscribe_to_campaign skips double opt-in by default', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await expect(run(subscribeToCampaignAction)({ accountId: A, campaignId: '9', email: SUB.email, reactivateIfRemoved: true })).resolves.toEqual({ campaignId: '9', subscriber: SUB });
    expect(seen[0].path).toBe(`/${A}/campaigns/9/subscribers`);
    expect(seen[0].body).toEqual({ subscribers: [{ email: SUB.email, double_optin: false, reactivate_if_removed: true }] });
  });
  test('subscribe_to_campaign passes options and validates the index', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await run(subscribeToCampaignAction)({ accountId: A, campaignId: '9', email: SUB.email, doubleOptin: true, startingEmailIndex: 2, tags: ['t'], customFields: { a: 1 }, timeZone: 'Asia/Amman' });
    expect(seen[0].body).toEqual({ subscribers: [{ email: SUB.email, double_optin: true, starting_email_index: 2, tags: ['t'], custom_fields: { a: 1 }, time_zone: 'Asia/Amman' }] });
    await expect(run(subscribeToCampaignAction)({ accountId: A, campaignId: '9', email: SUB.email, startingEmailIndex: -1 })).rejects.toThrow('Starting Email Index');
  });
  test('start_workflow sends the subscriber record; remove_from_workflow DELETEs', async () => {
    const seen = stubFetch((request) => (request.method === 'POST' ? { body: { subscribers: [SUB] } } : { status: 204 }));
    await expect(run(startWorkflowAction)({ accountId: A, workflowId: '77', subscriber: SUB.email, firstName: 'O', tags: ['x'] })).resolves.toEqual({ workflowId: '77', subscriber: SUB });
    expect(seen[0].path).toBe(`/${A}/workflows/77/subscribers`);
    expect(seen[0].body).toEqual({ subscribers: [{ email: SUB.email, first_name: 'O', tags: ['x'] }] });
    await expect(run(removeFromWorkflowAction)({ accountId: A, workflowId: '77', subscriber: SUB.email })).resolves.toEqual({ workflowId: '77', subscriber: SUB.email, removed: true });
    expect(seen[1].method).toBe('DELETE');
    expect(seen[1].path).toBe(`/${A}/workflows/77/subscribers/odai%2Baptest-1%40activepieces.com`);
  });
  test('start_workflow returns subscriber null when Drip returns none', async () => {
    stubFetch(() => ({ body: { subscribers: [] } }));
    await expect(run(startWorkflowAction)({ accountId: A, workflowId: '77', subscriber: SUB.email })).resolves.toEqual({ workflowId: '77', subscriber: null });
  });
});
