import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_KEY, AUTH, BASE, fail, memoryStore, ok, request, runAction, runHook, sendRequest, sign } from './helpers';
import { systemeIoAuth } from '../src/lib/common/auth';
import { systemeIoInput } from '../src/lib/common/client';
import { contactDropdownOptions, courseDropdown, courseModulesDropdown, tagPicker } from '../src/lib/common/dropdowns';
import { getContact } from '../src/lib/actions/get-contact';
import { deleteTag } from '../src/lib/actions/delete-tag';
import { removeContactFromCommunity } from '../src/lib/actions/remove-contact-from-community';
import { createContact } from '../src/lib/actions/create-contact';
import { addTagToContact } from '../src/lib/actions/add-tag-to-contact';
import { removeTagFromContact } from '../src/lib/actions/remove-tag-from-contact';
import { findContacts } from '../src/lib/actions/find-contacts';
import { updateContact } from '../src/lib/actions/update-contact';
import { createTag } from '../src/lib/actions/create-tag';
import { removeCourseEnrollment } from '../src/lib/actions/remove-course-enrollment';
import { systemeGetTag } from '../src/lib/actions/ai/get-tag';
import { systemeListCommunities } from '../src/lib/actions/ai/list-communities';
import { systemeListCommunityMemberships } from '../src/lib/actions/ai/list-community-memberships';
import { systemeListContactFields } from '../src/lib/actions/ai/list-contact-fields';
import { systemeListCourses } from '../src/lib/actions/ai/list-courses';
import { systemeListEnrollments } from '../src/lib/actions/ai/list-enrollments';
import { systemeAddTagToContact } from '../src/lib/actions/ai/add-tag-to-contact';
import { systemeCreateContact } from '../src/lib/actions/ai/create-contact';
import { newContact } from '../src/lib/triggers/new-contact';
import { newSale } from '../src/lib/triggers/new-sale';
import { saleCanceled } from '../src/lib/triggers/sale-canceled';
import { newOptIn } from '../src/lib/triggers/new-opt-in';
import { newTagAddedToContact } from '../src/lib/triggers/new-tag-added-to-contact';
import { contactTagRemoved } from '../src/lib/triggers/contact-tag-removed';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

const CONTACT = { id: 5, email: 'jane@example.com', fields: [], tags: [{ id: 7, name: 'vip' }] };
const SECRET = 'whsec';

beforeEach(() => {
  sendRequest.mockReset();
});

function options({ prop, input = {}, searchValue }: { prop: unknown; input?: Record<string, unknown>; searchValue?: string }): Promise<unknown> {
  const fn: unknown = typeof prop === 'object' && prop !== null ? Reflect.get(prop, 'options') : undefined;
  if (typeof fn !== 'function') {
    throw new Error('not a dropdown');
  }
  return Promise.resolve(Reflect.apply(fn, prop, [{ auth: AUTH, ...input }, { searchValue }]));
}

function signed({ body, messageId }: { body: unknown; messageId: string }) {
  const raw = JSON.stringify(body);
  return { headers: { 'x-webhook-signature': sign({ secret: SECRET, body: raw }), 'x-webhook-message-id': messageId }, body, rawBody: raw };
}

describe('request shape of each action without one elsewhere', () => {
  it('get_contact reads /contacts/{id}', async () => {
    ok({ body: CONTACT });
    expect(await runAction({ action: getContact, props: { contact_id: '5' } })).toEqual(CONTACT);
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).method).toBe('GET');
    expect(request(0).url).toBe(`${BASE}/contacts/5`);
    expect(request(0).headers['X-API-Key']).toBe(API_KEY);
  });

  it('delete_tag deletes /tags/{id}', async () => {
    ok({ body: undefined, status: 204 });
    expect(await runAction({ action: deleteTag, props: { tag_id: 9 } })).toEqual({ deleted: true, not_found: false, id: 9 });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).method).toBe('DELETE');
    expect(request(0).url).toBe(`${BASE}/tags/9`);
  });

  it('remove_contact_from_community lists by community and contact, then deletes only the matching membership', async () => {
    ok({
      body: {
        items: [
          { id: 77, community: { id: 3 }, contact: { id: 5 } },
          { id: 78, community: { id: 3 }, contact: { id: 6 } },
        ],
        hasMore: false,
      },
    });
    ok({ body: undefined, status: 204 });
    expect(await runAction({ action: removeContactFromCommunity, props: { community_id: 3, contact_id: 5 } })).toEqual({
      removed: true,
      removed_count: 1,
      removed_ids: [77],
      not_found: false,
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(0).url).toBe(`${BASE}/community/memberships`);
    expect(request(0).queryParams).toEqual({ community: '3', contact: '5', limit: '100' });
    expect(request(1).method).toBe('DELETE');
    expect(request(1).url).toBe(`${BASE}/community/memberships/77`);
  });

  it('createContact (human) posts the contact, then assigns each existing tag', async () => {
    ok({ body: { id: 42, email: 'new@b.co' }, status: 201 });
    ok({ body: undefined, status: 204 });
    const result = await runAction({
      action: createContact,
      props: { email: 'new@b.co', locale: 'fr', tagSource: 'existing', existingTags: [7] },
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(0).method).toBe('POST');
    expect(request(0).url).toBe(`${BASE}/contacts`);
    expect(request(0).body).toEqual({ email: 'new@b.co', locale: 'fr' });
    expect(request(1).url).toBe(`${BASE}/contacts/42/tags`);
    expect(request(1).body).toEqual({ tagId: 7 });
    expect(result).toMatchObject({ contact: { id: 42 }, totalTagsAssigned: 1 });
  });

  it('addTagToContact (human) assigns an existing tag', async () => {
    ok({ body: undefined, status: 204 });
    expect(await runAction({ action: addTagToContact, props: { contactId: 5, tagSource: 'existing', existingTagId: 7 } })).toMatchObject({
      success: true,
      contactId: 5,
      tagId: 7,
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).method).toBe('POST');
    expect(request(0).url).toBe(`${BASE}/contacts/5/tags`);
    expect(request(0).body).toEqual({ tagId: 7 });
  });

  it('removeTagFromContact reads the tag name, then deletes /contacts/{id}/tags/{tagId}', async () => {
    ok({ body: CONTACT });
    ok({ body: undefined, status: 204 });
    expect(await runAction({ action: removeTagFromContact, props: { contactId: 5, tagId: 7 } })).toMatchObject({ success: true, tagName: 'vip' });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(0).url).toBe(`${BASE}/contacts/5`);
    expect(request(1).method).toBe('DELETE');
    expect(request(1).url).toBe(`${BASE}/contacts/5/tags/7`);
  });

  it('systeme_get_tag reads /tags/{id} and flattens it', async () => {
    ok({ body: { id: 9, name: 'vip', createdAt: '2026-09-01T00:00:00+00:00' } });
    expect(await runAction({ action: systemeGetTag, props: { tag_id: '9' } })).toEqual({ id: 9, name: 'vip', created_at: '2026-09-01T00:00:00+00:00' });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).url).toBe(`${BASE}/tags/9`);
  });

  it('systeme_list_communities searches /community/communities', async () => {
    ok({ body: { items: [{ id: 3, name: 'Club', path: 'club', domainName: 'x.systeme.io' }], hasMore: false } });
    expect(await runAction({ action: systemeListCommunities, props: { query: ' club ' } })).toEqual({
      communities: [{ id: 3, name: 'Club', path: 'club', domain_name: 'x.systeme.io' }],
      count: 1,
      has_more: false,
      next_cursor: null,
    });
    expect(request(0).url).toBe(`${BASE}/community/communities`);
    expect(request(0).queryParams).toEqual({ query: 'club', limit: '100' });
  });

  it('systeme_list_community_memberships filters by community and contact', async () => {
    ok({ body: { items: [{ id: 77, community: { id: 3, name: 'Club' }, contact: { id: 5 } }], hasMore: false } });
    expect(await runAction({ action: systemeListCommunityMemberships, props: { community_id: '3', contact_id: '5' } })).toMatchObject({
      memberships: [{ id: 77, community_id: 3, community_name: 'Club', contact_id: 5 }],
      count: 1,
    });
    expect(request(0).url).toBe(`${BASE}/community/memberships`);
    expect(request(0).queryParams).toEqual({ community: '3', contact: '5', limit: '100' });
  });

  it('systeme_list_contact_fields reads /contact_fields', async () => {
    ok({ body: { items: [{ slug: 'first_name', fieldName: 'First name' }], hasMore: false } });
    expect(await runAction({ action: systemeListContactFields, props: {} })).toEqual({
      fields: [{ slug: 'first_name', field_name: 'First name' }],
      count: 1,
      has_more: false,
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).url).toBe(`${BASE}/contact_fields`);
  });

  it('systeme_list_courses sends the active filter as three states', async () => {
    expect(String(systemeListCourses.props.active.type)).toBe('SHORT_TEXT');
    ok({ body: { items: [], hasMore: false } });
    await runAction({ action: systemeListCourses, props: { query: 'yoga', active: 'false' } });
    expect(request(0).url).toBe(`${BASE}/school/courses`);
    expect(request(0).queryParams).toEqual({ query: 'yoga', active: 'false', limit: '100' });
    ok({ body: { items: [], hasMore: false } });
    await runAction({ action: systemeListCourses, props: { active: '' } });
    expect(request(1).queryParams).toEqual({ limit: '100' });
    await expect(runAction({ action: systemeListCourses, props: { active: 'maybe' } })).rejects.toThrow(/active must be true or false/);
  });

  it('systeme_list_enrollments filters by course and contact, and again client-side', async () => {
    ok({
      body: {
        items: [
          { id: 1, accessType: 'full_access', course: { id: 2 }, contact: { id: 5 } },
          { id: 2, accessType: 'full_access', course: { id: 3 }, contact: { id: 5 } },
        ],
        hasMore: false,
      },
    });
    const result = await runAction({ action: systemeListEnrollments, props: { course_id: '2', contact_id: '5' } });
    expect(request(0).url).toBe(`${BASE}/school/enrollments`);
    expect(request(0).queryParams).toEqual({ course: '2', contact: '5', limit: '100' });
    expect(result).toMatchObject({ enrollments: [{ id: 1, course_id: 2, contact_id: 5 }], count: 1 });
  });
});

describe('triggers: payloads and filters', () => {
  it('newTagAddedToContact returns {contact, tag} for the documented double nesting too', async () => {
    const { store } = memoryStore({ new_tag_added_webhook_secret: SECRET });
    const body = { contact: { contact: CONTACT }, tag: { id: 7, name: 'vip' } };
    expect(await runHook({ trigger: newTagAddedToContact, hook: 'run', context: { store, payload: signed({ body, messageId: 'a1' }) } })).toEqual([
      { contact: CONTACT, tag: { id: 7, name: 'vip' } },
    ]);
  });

  it('contact_tag_removed honours Only for Tag', async () => {
    const { store } = memoryStore({ contact_tag_removed_webhook_secret: SECRET });
    const body = { contact: CONTACT, tag: { id: 7, name: 'vip' } };
    const run = ({ tag, messageId }: { tag: unknown; messageId: string }) =>
      runHook({ trigger: contactTagRemoved, hook: 'run', context: { store, payload: signed({ body, messageId }), propsValue: { tag } } });
    expect(await run({ tag: 8, messageId: 'r1' })).toEqual([]);
    expect(await run({ tag: 7, messageId: 'r2' })).toEqual([body]);
    expect(await run({ tag: undefined, messageId: 'r3' })).toEqual([body]);
  });

  it('newSale returns the sale payload and unwraps a {sale} envelope', async () => {
    const { store } = memoryStore({ new_sale_webhook_secret: SECRET });
    const sale = { customer: { contactId: 5, email: 'jane@example.com' }, order: { id: 11 }, pricePlan: { id: 3, amount: 1200 } };
    expect(await runHook({ trigger: newSale, hook: 'run', context: { store, payload: signed({ body: sale, messageId: 's1' }) } })).toEqual([sale]);
    expect(await runHook({ trigger: newSale, hook: 'run', context: { store, payload: signed({ body: { sale }, messageId: 's2' }) } })).toEqual([sale]);
  });

  it('sale_canceled subscribes to SALE_CANCELED, verifies the signature and returns the payload as sent', async () => {
    const { store, data } = memoryStore();
    ok({ body: { id: 'wh_9' }, status: 201 });
    await runHook({ trigger: saleCanceled, hook: 'onEnable', context: { store } });
    expect(request(0).body.subscriptions).toEqual([{ event: 'SALE_CANCELED', schemaVersion: 2 }]);
    expect(request(0).body.name).toBe('Activepieces Webhook - SALE_CANCELED - abc');
    const secret = data.get('sale_canceled_webhook_secret');
    if (typeof secret !== 'string') {
      throw new Error('no secret stored');
    }
    const body = { customer: { contactId: 5 }, order: { id: 11 } };
    const raw = JSON.stringify(body);
    const payload = { headers: { 'x-webhook-signature': sign({ secret, body: raw }), 'x-webhook-message-id': 'c1' }, body, rawBody: raw };
    expect(await runHook({ trigger: saleCanceled, hook: 'run', context: { store, payload } })).toEqual([body]);
    const forged = { ...payload, headers: { 'x-webhook-signature': 'deadbeef', 'x-webhook-message-id': 'c2' } };
    await expect(runHook({ trigger: saleCanceled, hook: 'run', context: { store, payload: forged } })).rejects.toThrow(/signature does not match/);
  });

  it('a published enable leaves the flow\'s test webhook alone, and a test enable leaves the published one alone', async () => {
    const clash = { detail: 'name: This value is already used.', violations: [{ propertyPath: 'name', message: 'This value is already used.' }] };
    const hooks = [
      { id: 'wh_pub', name: 'Activepieces Webhook - CONTACT_CREATED - abc', url: 'https://ap.example.com/v1/webhooks/abc' },
      { id: 'wh_test', name: 'Activepieces Webhook - CONTACT_CREATED - abc-test', url: 'https://ap.example.com/v1/webhooks/abc/test' },
    ];
    fail({ status: 422, body: clash });
    ok({ body: { items: hooks, hasMore: false } });
    ok({ body: undefined, status: 204 });
    ok({ body: { id: 'wh_new' }, status: 201 });
    await runHook({ trigger: newContact, hook: 'onEnable', context: { store: memoryStore().store } });
    expect(sendRequest.mock.calls.filter((call) => call[0].method === 'DELETE').map((call) => call[0].url)).toEqual([`${BASE}/webhooks/wh_pub`]);

    sendRequest.mockReset();
    fail({ status: 422, body: clash });
    ok({ body: { items: hooks, hasMore: false } });
    ok({ body: undefined, status: 204 });
    ok({ body: { id: 'wh_new2' }, status: 201 });
    await runHook({
      trigger: newContact,
      hook: 'onEnable',
      context: { store: memoryStore().store, webhookUrl: 'https://ap.example.com/v1/webhooks/abc/test' },
    });
    expect(sendRequest.mock.calls.filter((call) => call[0].method === 'DELETE').map((call) => call[0].url)).toEqual([`${BASE}/webhooks/wh_test`]);
  });
});

describe('review fixes', () => {
  it('rejects ids beyond the safe integer range instead of rounding them', () => {
    expect(systemeIoInput.requireId({ value: '9007199254740991', name: 'Contact' })).toBe(9007199254740991);
    expect(() => systemeIoInput.requireId({ value: '9007199254740993', name: 'Contact' })).toThrow(/positive whole number/);
  });

  it('auth validate does not double the period of a vendor message', async () => {
    fail({ status: 500, body: { detail: 'Server error.' } });
    const result: unknown = await Reflect.apply(systemeIoAuth.validate ?? (() => undefined), undefined, [{ auth: API_KEY }]);
    expect(result).toEqual({
      valid: false,
      error: 'Authentication failed: Systeme.io API error 500: Server error. Please verify your API key is correct.',
    });
  });

  it('systeme_add_tag_to_contact keeps the original 422 when the follow-up read fails', async () => {
    fail({ status: 422, body: { detail: 'tagId: Tag with ID 9 not found.' } });
    fail({ status: 500, body: { detail: 'boom' } });
    await expect(runAction({ action: systemeAddTagToContact, props: { contact_id: '5', tag_id: '9' } })).rejects.toThrow(/422: tagId: Tag with ID 9 not found/);
  });

  it('systeme_create_contact returns the contact with the tags it just assigned, and the created one if that read fails', async () => {
    ok({ body: { id: 42, email: 'new@b.co', tags: [] }, status: 201 });
    ok({ body: undefined, status: 204 });
    ok({ body: { id: 42, email: 'new@b.co', tags: [{ id: 7, name: 'vip' }] } });
    const tagged = await runAction({ action: systemeCreateContact, props: { email: 'new@b.co', tag_ids: ['7'] } });
    expect(request(2).url).toBe(`${BASE}/contacts/42`);
    expect(tagged).toMatchObject({ contact: { tags: [{ id: 7, name: 'vip' }] }, tags_assigned: 1 });

    ok({ body: { id: 43, email: 'b@b.co', tags: [] }, status: 201 });
    ok({ body: undefined, status: 204 });
    fail({ status: 500, body: { detail: 'boom' } });
    expect(await runAction({ action: systemeCreateContact, props: { email: 'b@b.co', tag_ids: ['7'] } })).toMatchObject({
      contact: { id: 43, tags: [] },
      tags_assigned: 1,
    });
  });

  it('tag pickers search by name and say when the list is cut at 1,000', async () => {
    const page = (start: number) => ({ items: Array.from({ length: 100 }, (_, i) => ({ id: start - i, name: `t${start - i}` })), hasMore: true });
    for (let i = 0; i < 10; i++) ok({ body: page(5000 - i * 100) });
    const state = await options({ prop: tagPicker({ required: false }) });
    expect(state).toMatchObject({ disabled: false, placeholder: 'Showing the first 1,000 tags. Type to search, or map an id.' });

    for (const prop of [findContacts.props.tag_ids, addTagToContact.props.existingTagId, createContact.props.existingTags]) {
      expect(Reflect.get(prop, 'refreshOnSearch')).toBe(true);
    }
    sendRequest.mockReset();
    ok({ body: { items: [{ id: 7, name: 'vip' }], hasMore: false } });
    expect(await options({ prop: addTagToContact.props.existingTagId, input: { tagSource: 'existing' }, searchValue: 'vi' })).toEqual({
      disabled: false,
      placeholder: undefined,
      options: [{ label: 'vip', value: 7 }],
    });
    expect(request(0).url).toBe(`${BASE}/tags`);
    expect(request(0).queryParams).toEqual({ query: 'vi', limit: '100' });
  });

  it('the module picker pages /school/course-modules for the course', async () => {
    ok({ body: { items: [{ id: 11, name: 'Intro' }, { id: 12, name: 'Deep dive' }], hasMore: true } });
    ok({ body: { items: [{ id: 13, name: 'Wrap-up' }], hasMore: false } });
    const state = await options({ prop: courseModulesDropdown, input: { course_id: 4, access_type: 'partial_access' } });
    expect(request(0).url).toBe(`${BASE}/school/course-modules`);
    expect(request(0).queryParams).toEqual({ courseId: '4', limit: '100' });
    expect(request(1).queryParams).toEqual({ courseId: '4', limit: '100', startingAfter: '12' });
    expect(state).toMatchObject({ options: [{ value: 11 }, { value: 12 }, { value: 13 }] });
  });
});

describe('webhook schema versions', () => {
  it('subscribes contact events at version 1 and sale events at version 2, as the plain-string form resolves them', async () => {
    const cases: Array<[Record<string, unknown>, string, number]> = [
      [newContact, 'CONTACT_CREATED', 1],
      [newTagAddedToContact, 'CONTACT_TAG_ADDED', 1],
      [contactTagRemoved, 'CONTACT_TAG_REMOVED', 1],
      [newOptIn, 'CONTACT_OPT_IN', 1],
      [newSale, 'SALE_NEW', 2],
      [saleCanceled, 'SALE_CANCELED', 2],
    ];
    for (const [trigger, event, schemaVersion] of cases) {
      sendRequest.mockReset();
      ok({ body: { id: 'wh' }, status: 201 });
      await runHook({ trigger, hook: 'onEnable', context: { store: memoryStore().store } });
      expect(request(0).body.subscriptions).toEqual([{ event, schemaVersion }]);
    }
  });
});

describe('review round 2', () => {
  const newest = {
    items: [
      { id: 3, email: 'jane@example.com', fields: [{ slug: 'first_name', value: 'Jane' }] },
      { id: 2, email: 'bob@example.com', fields: [{ slug: 'first_name', value: 'Bob' }] },
    ],
    hasMore: false,
  };

  it('the contact picker does not send a partial email to the email filter, and never disables itself for it', async () => {
    for (const search of ['jane@', '@']) {
      sendRequest.mockReset();
      ok({ body: newest });
      const state = await contactDropdownOptions({ apiKey: API_KEY, searchValue: search });
      expect(sendRequest).toHaveBeenCalledTimes(1);
      expect(request(0).queryParams).toEqual({ limit: '100' });
      expect(state.disabled).toBe(false);
    }
    expect((await contactDropdownOptions({ apiKey: API_KEY, searchValue: 'jane@' })).options).toEqual([]);
  });

  it('the contact picker treats a rejected email and an unsafe id as no match', async () => {
    fail({ status: 422, body: { detail: 'email: This value is not a valid email address.' } });
    expect(await contactDropdownOptions({ apiKey: API_KEY, searchValue: 'jane@example.c' })).toEqual({
      disabled: false,
      placeholder: 'No contact matches "jane@example.c". Type the full email address or a contact id.',
      options: [],
    });
    sendRequest.mockReset();
    expect(await contactDropdownOptions({ apiKey: API_KEY, searchValue: '9007199254740993' })).toMatchObject({ disabled: false, options: [] });
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('a name search filters the newest contacts by name or email', async () => {
    ok({ body: newest });
    expect(await contactDropdownOptions({ apiKey: API_KEY, searchValue: 'JAN' })).toEqual({
      disabled: false,
      placeholder: undefined,
      options: [{ label: 'Jane (jane@example.com)', value: 3 }],
    });
    ok({ body: newest });
    expect(await contactDropdownOptions({ apiKey: API_KEY, searchValue: 'zed' })).toMatchObject({ options: [], disabled: false });
  });

  it('a tag or course search reads one page per keystroke and says to type more', async () => {
    const page = { items: Array.from({ length: 100 }, (_, i) => ({ id: 500 - i, name: `vip${i}` })), hasMore: true };
    ok({ body: page });
    const tags = await options({ prop: tagPicker({ required: false }), searchValue: 'vip' });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(tags).toMatchObject({ placeholder: 'Showing the first 100 matching tags. Type more to narrow the search.' });
    sendRequest.mockReset();
    ok({ body: page });
    const courses = await options({ prop: courseDropdown, searchValue: 'vip' });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).queryParams).toEqual({ query: 'vip', limit: '100' });
    expect(courses).toMatchObject({ placeholder: 'Showing the first 100 matching courses. Type more to narrow the search.' });
  });

  it('sale_canceled unwraps a {sale} envelope like New Sale', async () => {
    const { store } = memoryStore({ sale_canceled_webhook_secret: SECRET });
    const sale = { customer: { contactId: 5 }, order: { id: 11 } };
    expect(await runHook({ trigger: saleCanceled, hook: 'run', context: { store, payload: signed({ body: { sale }, messageId: 'x1' }) } })).toEqual([sale]);
  });

  it('the human contact actions refuse a malformed contact id before any request', async () => {
    await expect(runAction({ action: updateContact, props: { contactId: '1/../x', locale: 'de' } })).rejects.toThrow(/Contact ID must be a positive whole number/);
    await expect(runAction({ action: addTagToContact, props: { contactId: '1/x', tagSource: 'new', newTagName: 'vip' } })).rejects.toThrow(/Contact ID/);
    await expect(runAction({ action: removeTagFromContact, props: { contactId: 5, tagId: '7/x' } })).rejects.toThrow(/Tag ID/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('create_tag creates nothing when the name search is cut off before an exact match', async () => {
    const page = (start: number) => ({ items: Array.from({ length: 100 }, (_, i) => ({ id: start - i, name: `vip ${start - i}` })), hasMore: true });
    for (let i = 0; i < 10; i++) ok({ body: page(5000 - i * 100) });
    await expect(runAction({ action: createTag, props: { name: 'vip' } })).rejects.toThrow(/could not be ruled out. No tag was created/);
    expect(sendRequest.mock.calls.every((call) => call[0].method === 'GET')).toBe(true);
  });

  it('a removal that fails part-way reports what it already removed', async () => {
    ok({ body: { items: [{ id: 1, course: { id: 2 }, contact: { id: 5 } }, { id: 2, course: { id: 2 }, contact: { id: 5 } }], hasMore: false } });
    ok({ body: undefined, status: 204 });
    fail({ status: 500, body: { detail: 'boom' } });
    await expect(runAction({ action: removeCourseEnrollment, props: { course_id: 2, contact_id: 5 } })).rejects.toThrow(
      /^Removed 1, then removing 2 failed: Systeme\.io API error 500: boom\.$/,
    );
  });
});

describe('greptile round 1', () => {
  it('both tag triggers keep every top-level field of the delivery', async () => {
    const body = { contact: CONTACT, tag: { id: 7, name: 'vip' }, addedAt: '2026-09-30T10:00:00+00:00', source: 'api' };
    const added = memoryStore({ new_tag_added_webhook_secret: SECRET });
    expect(await runHook({ trigger: newTagAddedToContact, hook: 'run', context: { store: added.store, payload: signed({ body, messageId: 'g1' }) } })).toEqual([body]);
    const removed = memoryStore({ contact_tag_removed_webhook_secret: SECRET });
    expect(await runHook({ trigger: contactTagRemoved, hook: 'run', context: { store: removed.store, payload: signed({ body, messageId: 'g2' }) } })).toEqual([body]);
    const nested = { contact: { contact: CONTACT }, tag: { id: 7, name: 'vip' }, addedAt: '2026-09-30T10:00:00+00:00' };
    expect(await runHook({ trigger: newTagAddedToContact, hook: 'run', context: { store: added.store, payload: signed({ body: nested, messageId: 'g3' }) } })).toEqual([
      { contact: CONTACT, tag: { id: 7, name: 'vip' }, addedAt: '2026-09-30T10:00:00+00:00' },
    ]);
  });

  it('onEnable clears the stored id when saving the secret fails, and deletes the new webhook', async () => {
    const data = new Map<string, unknown>();
    const store = {
      put: async (key: string, value: unknown) => {
        if (key.endsWith('_webhook_secret')) {
          throw new Error('store down');
        }
        data.set(key, value);
        return value;
      },
      get: async (key: string) => data.get(key) ?? null,
      delete: async (key: string) => {
        data.delete(key);
      },
    };
    ok({ body: { id: 'wh_5' }, status: 201 });
    ok({ body: undefined, status: 204 });
    await expect(runHook({ trigger: newContact, hook: 'onEnable', context: { store } })).rejects.toThrow('store down');
    expect(request(1).method).toBe('DELETE');
    expect(request(1).url).toBe(`${BASE}/webhooks/wh_5`);
    expect(data.has('new_contact_webhook_id')).toBe(false);
  });

  it('a name search with no match says it only covered the newest 100 contacts', async () => {
    ok({ body: { items: [{ id: 3, email: 'jane@example.com', fields: [] }], hasMore: false } });
    expect(await contactDropdownOptions({ apiKey: API_KEY, searchValue: 'zed' })).toEqual({
      disabled: false,
      placeholder: 'No match for "zed" among the newest 100 contacts. Type the full email address or a contact id.',
      options: [],
    });
  });

  it('Find Contacts status filters describe Yes and No in plain words', () => {
    expect(findContacts.props.bounced.description).toBe('Optional. Yes: only contacts whose emails bounced. No: only contacts whose emails did not bounce. Leave empty for both.');
    expect(findContacts.props.unsubscribed.description).toBe(
      'Optional. Yes: only contacts unsubscribed from emails. No: only contacts still subscribed to emails. Leave empty for both.',
    );
  });
});
