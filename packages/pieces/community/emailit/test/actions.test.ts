import { afterEach, describe, expect, test, vi } from 'vitest';
import { addSubscriberAction, addSubscriberByIdAction } from '../src/lib/actions/add-subscriber';
import { addSuppressionAction } from '../src/lib/actions/add-suppression';
import { cancelEmailAction } from '../src/lib/actions/cancel-email';
import { findContactAction } from '../src/lib/actions/find-contact';
import { forwardEmailAction } from '../src/lib/actions/forward-email';
import { getEmailAction } from '../src/lib/actions/get-email';
import { listEmailsAction } from '../src/lib/actions/list-emails';
import { listTemplatesAction } from '../src/lib/actions/list-templates';
import { removeSubscriberAction } from '../src/lib/actions/remove-subscriber';
import { removeSuppressionAction } from '../src/lib/actions/remove-suppression';
import { rescheduleEmailAction } from '../src/lib/actions/reschedule-email';
import { updateSubscriberAction } from '../src/lib/actions/update-subscriber';
import { upsertContactAction } from '../src/lib/actions/upsert-contact';
import { replies, run, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('email actions', () => {
  test('get_email encodes the ID and drops attachment contents', async () => {
    const seen = stubFetch(replies([{ body: { id: 'em_1', attachments: [{ filename: 'a.pdf', size: 3, content: 'AAAA' }] } }]));
    const result = await run({ action: getEmailAction, props: { email_id: ' em_1/../x ' } });
    expect(seen[0].url.pathname).toBe('/v2/emails/em_1%2F..%2Fx');
    expect(result).toEqual({ id: 'em_1', attachments: [{ filename: 'a.pdf', size: 3 }] });
  });
  test('list_emails sends filters and reports hasMore', async () => {
    const seen = stubFetch(replies([{ body: { data: [{ id: 'em_1' }], next_page_url: '/v2/emails?page=3' } }]));
    const result = await run({ action: listEmailsAction, props: { status: 'bounced', to: 'a@b.co', date_from: '2026-10-01', limit: 10, page: 2 } });
    expect(Object.fromEntries(seen[0].url.searchParams)).toEqual({ 'status.exact': 'bounced', 'to.exact': 'a@b.co', date_from: '2026-10-01', limit: '10', page: '2' });
    expect(result).toEqual({ items: [{ id: 'em_1' }], count: 1, page: 2, hasMore: true, totalRecords: null });
    await expect(run({ action: listEmailsAction, props: { date_from: '01/10/2026' } })).rejects.toThrow('date like');
  });
  test('reschedule posts the ISO time', async () => {
    const seen = stubFetch(replies([{ body: { id: 'em_1', status: 'scheduled' } }]));
    await run({ action: rescheduleEmailAction, props: { email_id: 'em_1', scheduled_at: '2026-11-01T10:00:00Z' } });
    expect(seen[0]).toMatchObject({ method: 'POST', body: { scheduled_at: '2026-11-01T10:00:00.000Z' } });
    expect(seen[0].url.pathname).toBe('/v2/emails/em_1');
  });
  test('cancel returns alreadyCanceled when the email is already canceled', async () => {
    const seen = stubFetch(replies([{ status: 422, body: { error: 'Cannot cancel email' } }, { body: { status: 'canceled' } }]));
    expect(await run({ action: cancelEmailAction, props: { email_id: 'em_1' } })).toMatchObject({ alreadyCanceled: true, status: 'canceled' });
    expect(seen[1].url.pathname).toBe('/v2/email/em_1');
  });
  test('cancel still fails when the email was delivered', async () => {
    stubFetch(replies([{ status: 422, body: { error: 'Cannot cancel email' } }, { body: { status: 'delivered' } }]));
    await expect(run({ action: cancelEmailAction, props: { email_id: 'em_1' } })).rejects.toThrow('can no longer be canceled');
  });
  test('forward only sends the note with the header option and passes the idempotency key', async () => {
    const seen = stubFetch(replies([{ body: { id: 'em_9', original_id: 'em_1' } }]));
    await run({ action: forwardEmailAction, props: { email_id: 'em_1', to: ['a@b.co'], comment: 'fyi', idempotency_key: 'fw-1' } });
    expect(seen[0].body).toEqual({ to: ['a@b.co'] });
    expect(seen[0].headers.get('idempotency-key')).toBe('fw-1');
  });
});

describe('audience, contact and suppression actions', () => {
  test('add_subscriber returns the existing subscriber on 409', async () => {
    stubFetch(replies([{ status: 409, body: { error: 'Contact is already subscribed', existing: { id: 'sub_1', email: 'a@b.co', subscribed: true } } }]));
    expect(await run({ action: addSubscriberAction, props: { audience: 'aud_1', email: 'a@b.co' } })).toEqual({ id: 'sub_1', email: 'a@b.co', subscribed: true, alreadySubscribed: true });
  });
  test('add_subscriber reads the subscriber back when the 409 has no existing record (live behavior)', async () => {
    const seen = stubFetch(replies([{ status: 409, body: { error: 'Contact is already subscribed to this audience' } }, { body: { id: 'sub_2', subscribed: true } }]));
    expect(await run({ action: addSubscriberAction, props: { audience: 'aud_1', email: 'a@b.co' } })).toEqual({ id: 'sub_2', subscribed: true, alreadySubscribed: true });
    expect(seen[1]).toMatchObject({ method: 'GET' });
    expect(seen[1].url.pathname).toBe('/v2/audiences/aud_1/subscribers/a%40b.co');
  });
  test('update_subscriber sends only chosen fields and refuses an empty update', async () => {
    const seen = stubFetch(replies([{ body: { id: 'sub_1', subscribed: false } }]));
    await run({ action: updateSubscriberAction, props: { audience: 'News letter', subscriber: 'a@b.co', subscribed: 'no' } });
    expect(seen[0].url.pathname).toBe('/v2/audiences/News%20letter/subscribers/a%40b.co');
    expect(seen[0].body).toEqual({ subscribed: false });
    await expect(run({ action: updateSubscriberAction, props: { audience: 'aud_1', subscriber: 'a@b.co', subscribed: 'keep' } })).rejects.toThrow('at least one change');
    expect(seen).toHaveLength(1);
  });
  test('remove_subscriber: 404 on the subscriber with an existing audience is alreadyRemoved', async () => {
    stubFetch(replies([{ status: 404, body: { error: 'Subscriber not found' } }, { body: { id: 'aud_1' } }]));
    expect(await run({ action: removeSubscriberAction, props: { audience: 'aud_1', subscriber: 'a@b.co' } })).toMatchObject({ alreadyRemoved: true, deleted: false });
    stubFetch(replies([{ status: 404, body: { error: 'Subscriber not found' } }, { status: 404, body: { error: 'Audience not found' } }]));
    await expect(run({ action: removeSubscriberAction, props: { audience: 'aud_x', subscriber: 'a@b.co' } })).rejects.toThrow('Audience not found');
  });
  test('find_contact returns found=false on 404 and fails on other errors', async () => {
    stubFetch(replies([{ status: 404, body: { error: 'Contact not found' } }]));
    expect(await run({ action: findContactAction, props: { contact: 'a@b.co' } })).toEqual({ found: false, contact: null });
    stubFetch(replies([{ status: 500, body: { error: 'boom' } }]));
    await expect(run({ action: findContactAction, props: { contact: 'a@b.co' } })).rejects.toThrow('boom');
  });
  test('create_or_update_contact creates when missing', async () => {
    const seen = stubFetch(replies([{ status: 404, body: { error: 'Contact not found' } }, { status: 201, body: { id: 'con_1', email: 'a@b.co' } }]));
    expect(await run({ action: upsertContactAction, props: { email: 'a@b.co', first_name: 'Ada', audiences: ['aud_1', ''] } })).toEqual({ id: 'con_1', email: 'a@b.co', created: true });
    expect(seen[1]).toMatchObject({ method: 'POST', body: { email: 'a@b.co', first_name: 'Ada', audiences: ['aud_1'] } });
  });
  test('create_or_update_contact updates and keeps existing audiences', async () => {
    const seen = stubFetch(replies([{ body: { id: 'con_1', email: 'a@b.co', audiences: [{ id: 'aud_0' }] } }, { body: { id: 'con_1' } }]));
    expect(await run({ action: upsertContactAction, props: { email: 'a@b.co', last_name: 'L', audiences: ['aud_1'], unsubscribed: 'keep' } })).toMatchObject({ created: false });
    expect(seen[1].url.pathname).toBe('/v2/contacts/con_1');
    expect(seen[1].body).toEqual({ last_name: 'L', audiences: ['aud_0', 'aud_1'] });
  });
  test('create_or_update_contact with nothing to change makes no write', async () => {
    const seen = stubFetch(replies([{ body: { id: 'con_1', email: 'a@b.co', audiences: [{ id: 'aud_1' }] } }]));
    expect(await run({ action: upsertContactAction, props: { email: 'a@b.co', audiences: ['aud_1'] } })).toMatchObject({ id: 'con_1', created: false });
    expect(seen).toHaveLength(1);
  });
  test('add_suppression defaults to recipient and returns existing on 409', async () => {
    const seen = stubFetch(replies([{ status: 409, body: { error: 'exists', existing: { id: 'sup_1', email: 'a@b.co', type: 'recipient' } } }]));
    expect(await run({ action: addSuppressionAction, props: { email: 'a@b.co' } })).toMatchObject({ id: 'sup_1', alreadySuppressed: true });
    expect(seen[0].body).toEqual({ email: 'a@b.co', type: 'recipient' });
  });
  test('remove_suppression: 404 is alreadyRemoved', async () => {
    const seen = stubFetch(replies([{ status: 404, body: { error: 'Suppression not found' } }]));
    expect(await run({ action: removeSuppressionAction, props: { suppression: 'a@b.co' } })).toMatchObject({ alreadyRemoved: true });
    expect(seen[0]).toMatchObject({ method: 'DELETE' });
    expect(seen[0].url.pathname).toBe('/v2/suppressions/a%40b.co');
  });
});

describe('other actions', () => {
  test('list_templates uses per_page and filter[name]', async () => {
    const seen = stubFetch(replies([{ body: { data: [], total_records: 0, per_page: 5, current_page: 1, total_pages: 0 } }]));
    expect(await run({ action: listTemplatesAction, props: { name: 'welc', limit: 5 } })).toEqual({ items: [], count: 0, page: 1, hasMore: false, totalRecords: 0 });
    expect(Object.fromEntries(seen[0].url.searchParams)).toEqual({ 'filter[name]': 'welc', per_page: '5', page: '1' });
  });
});

describe('human and AI twins share the same request', () => {
  test('add_subscriber_by_id sends the same request as the dropdown action', async () => {
    const seen = stubFetch(replies([{ status: 201, body: { id: 'sub_1' } }]));
    await run({ action: addSubscriberAction, props: { audience: 'aud_1', email: 'a@b.co' } });
    await run({ action: addSubscriberByIdAction, props: { audience: ' aud_1 ', email: 'a@b.co' } });
    expect(seen[0].url.toString()).toBe(seen[1].url.toString());
    expect(seen[0].body).toEqual(seen[1].body);
  });
});
