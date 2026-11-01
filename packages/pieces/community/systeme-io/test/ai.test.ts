import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE, fail, ok, request, runAction, sendRequest } from './helpers';
import { systemeIo } from '../src/index';
import { systemeUpdateContact } from '../src/lib/actions/ai/update-contact';
import { systemeAddTagToContact } from '../src/lib/actions/ai/add-tag-to-contact';
import { systemeCreateContact } from '../src/lib/actions/ai/create-contact';
import { systemeListTags } from '../src/lib/actions/ai/list-tags';
import { systemeListSubscriptions } from '../src/lib/actions/ai/list-subscriptions';
import { systemeRenameTag } from '../src/lib/actions/ai/rename-tag';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

beforeEach(() => {
  sendRequest.mockReset();
});

describe('piece metadata', () => {
  const actions = Object.values(systemeIo.actions());

  it('every action declares audience, classification and aiMetadata', () => {
    for (const action of actions) {
      expect(action.audience, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
    }
  });

  it('ships 12 ai atomics and demotes the 3 twinned originals', () => {
    expect(actions.filter((a) => a.audience === 'ai')).toHaveLength(12);
    const audience = Object.fromEntries(actions.map((a) => [a.name, a.audience]));
    expect(audience['createContact']).toBe('human');
    expect(audience['updateContact']).toBe('human');
    expect(audience['addTagToContact']).toBe('human');
    expect(audience['findContactByEmail']).toBe('both');
    expect(audience['removeTagFromContact']).toBe('both');
  });

  it('keeps every original action and trigger name', () => {
    const names = actions.map((a) => a.name);
    for (const name of ['createContact', 'addTagToContact', 'removeTagFromContact', 'findContactByEmail', 'updateContact']) {
      expect(names).toContain(name);
    }
    expect(Object.keys(systemeIo.triggers())).toEqual(
      expect.arrayContaining(['newContact', 'newSale', 'newTagAddedToContact', 'contact_tag_removed', 'new_opt_in', 'sale_canceled']),
    );
  });

  it('every ai atomic takes ids as text, never as a dropdown', () => {
    for (const action of actions.filter((a) => a.audience === 'ai')) {
      for (const [key, prop] of Object.entries(action.props)) {
        expect(String(prop.type), `${action.name}.${key}`).not.toMatch(/DROPDOWN/);
      }
    }
  });
});

describe('systeme_update_contact (partial update, template section 6)', () => {
  it('sends only the slugs given, turns empty/null into a clear, and omits locale when unset', async () => {
    ok({ body: { id: 5, email: 'a@b.co' } });
    const result = await runAction({ action: systemeUpdateContact, props: {
      contact_id: '5',
      fields: [
        { slug: 'phone_number', value: '+1555' },
        { slug: 'country', value: '' },
        { slug: 'company', value: null },
      ],
    } });
    expect(request(0).method).toBe('PATCH');
    expect(request(0).url).toBe(`${BASE}/contacts/5`);
    expect(request(0).headers['Content-Type']).toBe('application/merge-patch+json');
    expect(request(0).body).toEqual({
      fields: [
        { slug: 'phone_number', value: '+1555' },
        { slug: 'country', value: null },
        { slug: 'company', value: null },
      ],
    });
    expect(result).toMatchObject({ updated_slugs: ['phone_number'], cleared_slugs: ['country', 'company'], locale_changed: false });
  });

  it('refuses an empty update before any request, and validates locale', async () => {
    await expect(runAction({ action: systemeUpdateContact, props: { contact_id: '5' } })).rejects.toThrow(/Nothing to update/);
    await expect(runAction({ action: systemeUpdateContact, props: { contact_id: '5', locale: 'ja' } })).rejects.toThrow(/jp/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('systeme_add_tag_to_contact', () => {
  it('converges when the tag is already on the contact (422 + re-read)', async () => {
    fail({ status: 422, body: { detail: 'Tag already assigned' } });
    ok({ body: { id: 5, email: 'a@b.co', tags: [{ id: 9, name: 'vip' }] } });
    expect(await runAction({ action: systemeAddTagToContact, props: { contact_id: '5', tag_id: '9' } })).toEqual({
      assigned: true,
      already_assigned: true,
      contact_id: 5,
      tag_id: 9,
    });
  });

  it('rethrows a 422 when the tag is not on the contact', async () => {
    fail({ status: 422, body: { detail: 'Invalid tag' } });
    ok({ body: { id: 5, email: 'a@b.co', tags: [] } });
    await expect(runAction({ action: systemeAddTagToContact, props: { contact_id: '5', tag_id: '9' } })).rejects.toThrow(/Invalid tag/);
  });
});

describe('systeme_create_contact', () => {
  it('creates, then reports tag failures per tag instead of failing', async () => {
    ok({ body: { id: 42, email: 'new@b.co', tags: [] }, status: 201 });
    ok({ body: undefined, status: 204 });
    fail({ status: 422, body: { detail: 'Tag not found' } });
    const result = await runAction({ action: systemeCreateContact, props: {
      email: ' new@b.co ',
      locale: 'fr',
      fields: [{ slug: 'first_name', value: 'Zoë' }, { slug: 'surname', value: '' }],
      tag_ids: ['1', '2'],
    } });
    expect(request(0).body).toEqual({ email: 'new@b.co', locale: 'fr', fields: [{ slug: 'first_name', value: 'Zoë' }] });
    expect(request(1).url).toBe(`${BASE}/contacts/42/tags`);
    expect(result).toMatchObject({
      contact_id: 42,
      tags_assigned: 1,
      tags_failed: 1,
      tag_results: [
        { tag_id: 1, assigned: true, error: null },
        { tag_id: 2, assigned: false },
      ],
    });
  });
});

describe('list inputs', () => {
  it('systeme_update_contact refuses fields that are not a list, before any request', async () => {
    await expect(runAction({ action: systemeUpdateContact, props: { contact_id: '5', fields: 'phone_number=1' } })).rejects.toThrow(/fields must be a list/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('list atomics', () => {
  it('systeme_list_tags flattens rows and returns a cursor', async () => {
    ok({ body: { items: [{ id: 3, name: 'a', createdAt: '2026-01-01T00:00:00+00:00' }], hasMore: true } });
    const result = await runAction({ action: systemeListTags, props: { query: 'a', max_results: 1 } });
    expect(request(0).queryParams).toEqual({ query: 'a', limit: '100' });
    expect(result).toEqual({
      tags: [{ id: 3, name: 'a', created_at: '2026-01-01T00:00:00+00:00' }],
      count: 1,
      has_more: true,
      next_cursor: 3,
    });
  });

  it('systeme_list_subscriptions requires a contact and flattens the price plan', async () => {
    await expect(runAction({ action: systemeListSubscriptions, props: { contact_id: '' } })).rejects.toThrow(/contact_id/);
    ok({ body: {
      items: [
        {
          id: 8,
          status: 'active',
          createdAt: 'c',
          cancelledAt: null,
          completedAt: null,
          pricePlan: { id: 1, name: 'Monthly', type: 'subscription', amount: 1900, currency: 'eur', recurringOptions: { interval: 'month', intervalCount: 1 } },
        },
      ],
      hasMore: false,
    } });
    const result = await runAction({ action: systemeListSubscriptions, props: { contact_id: '12' } });
    expect(request(0).queryParams).toEqual({ contact: '12', limit: '100' });
    expect(result).toMatchObject({
      subscriptions: [{ id: 8, status: 'active', price_plan_name: 'Monthly', amount: 1900, currency: 'eur', interval: 'month', interval_count: 1 }],
      count: 1,
      has_more: false,
      next_cursor: null,
    });
  });

  it('systeme_rename_tag uses PUT with only the name', async () => {
    ok({ body: { id: 3, name: 'b', createdAt: 'x' } });
    await runAction({ action: systemeRenameTag, props: { tag_id: '3', name: ' b ' } });
    expect(request(0).method).toBe('PUT');
    expect(request(0).body).toEqual({ name: 'b' });
  });
});
