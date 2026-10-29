import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bexioAiActions } from '../src/lib/actions/ai';
import { bexioListContacts, bexioSearchContacts, bexioUpdateContact } from '../src/lib/actions/ai/contacts';
import { bexioUpdateItem } from '../src/lib/actions/ai/items';
import { bexioCreateTimesheet } from '../src/lib/actions/ai/timesheets';
import { bexioCreateInvoice, bexioCreateInvoicePayment, bexioListInvoiceReminders, bexioSendInvoice } from '../src/lib/actions/ai/invoices';
import { bexioRevertQuoteIssue, bexioDeclineQuote, bexioSendQuote, bexioCreateOrderFromQuote, bexioCreateQuote } from '../src/lib/actions/ai/quotes';
import { bexioCreateInvoiceFromOrder, bexioCreateOrder } from '../src/lib/actions/ai/orders';
import { bexioCreateMilestone, bexioCreateWorkPackage } from '../src/lib/actions/ai/projects';
import { createManualEntryAction } from '../src/lib/actions/create-manual-entry';
import { bexioUnarchiveProject } from '../src/lib/actions/ai/projects';
import { updatePersonAction } from '../src/lib/actions/update-person';
import { updateProductAction } from '../src/lib/actions/update-product';
import { bexio } from '../src';
import { bexioAi } from '../src/lib/common/ai-helpers';

const AUTH = { access_token: 'token-1' };

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockBodies(bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

function requestAt({ spy, index }: { spy: ReturnType<typeof mockBodies>; index: number }) {
  return spy.mock.calls[index][0];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('piece metadata', () => {
  it('requires 0.86.4 and exposes ai atomics with metadata', () => {
    expect(bexio.minimumSupportedRelease).toBe('0.86.4');
    expect(bexioAiActions.length).toBeGreaterThanOrEqual(95);
    const names = new Set<string>();
    for (const action of bexioAiActions) {
      expect(action.audience).toBe('ai');
      expect(action.aiMetadata?.idempotent).toBeTypeOf('boolean');
      expect(action.classification).toBeDefined();
      expect(names.has(action.name)).toBe(false);
      names.add(action.name);
    }
  });

  it('keeps every legacy action human-only', () => {
    const legacy = Object.values(bexio.actions()).filter((action) => !action.name.startsWith('bexio_'));
    for (const action of legacy) {
      expect(action.audience).toBe('human');
    }
  });
});

describe('pagination', () => {
  it('sends limit, offset and order_by and reports the next offset', async () => {
    const spy = mockBodies([[{ id: 1 }, { id: 2 }]]);
    const out = await run({ action: bexioListContacts, propsValue: { limit: 2, offset: 4, order_by: 'id_desc', show_archived: 'yes' } });
    const req = requestAt({ spy, index: 0 });
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe('https://api.bexio.com/2.0/contact');
    expect(req.queryParams).toEqual({ limit: '2', offset: '4', order_by: 'id_desc', show_archived: 'true' });
    expect(out).toEqual({ items: [{ id: 1 }, { id: 2 }], count: 2, offset: 4, has_more: true, next_offset: 6 });
  });

  it('reports no more pages when a short page comes back', async () => {
    mockBodies([[{ id: 1 }]]);
    const out = await run({ action: bexioListContacts, propsValue: {} });
    expect(out).toEqual({ items: [{ id: 1 }], count: 1, offset: 0, has_more: false, next_offset: null });
  });

  it('rejects a limit above 2000 before any request', async () => {
    const spy = mockBodies([]);
    await expect(run({ action: bexioListContacts, propsValue: { limit: 5000 } })).rejects.toThrow('Limit must be between 1 and 2000');
    expect(spy).not.toHaveBeenCalled();
  });

  it('pages dropdown lists until a short page', async () => {
    const full = Array.from({ length: 2000 }, (_, index) => ({ id: index }));
    const spy = mockBodies([full, [{ id: 9999 }]]);
    const all = await bexioAi.listAll({ auth: AUTH, path: '/2.0/kb_invoice' });
    expect(all.items).toHaveLength(2001);
    expect(all.truncated).toBe(false);
    expect(requestAt({ spy, index: 1 }).queryParams).toEqual({ limit: '2000', offset: '2000', order_by: 'id_desc' });
  });
});

describe('search', () => {
  it('builds criteria with in-lists and a second criterion', async () => {
    const spy = mockBodies([[]]);
    await run({ action: bexioSearchContacts, propsValue: { field: 'contact_type_id', criteria: 'in', value: '1, 2', field_2: 'name_1', value_2: 'Acme' } });
    const req = requestAt({ spy, index: 0 });
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe('https://api.bexio.com/2.0/contact/search');
    expect(req.body).toEqual([
      { field: 'contact_type_id', value: ['1', '2'], criteria: 'in' },
      { field: 'name_1', value: 'Acme', criteria: 'like' },
    ]);
  });
});

describe('updates', () => {
  it('reads required fields from the current contact and posts the change', async () => {
    const spy = mockBodies([{ id: 7, contact_type_id: 1, name_1: 'Acme', user_id: 1, owner_id: 2 }, { id: 7 }]);
    await run({ action: bexioUpdateContact, propsValue: { contact_id: '7', mail: 'a@b.ch' } });
    expect(requestAt({ spy, index: 0 }).method).toBe(HttpMethod.GET);
    const post = requestAt({ spy, index: 1 });
    expect(post.method).toBe(HttpMethod.POST);
    expect(post.url).toBe('https://api.bexio.com/2.0/contact/7');
    expect(post.body).toEqual({ contact_type_id: 1, name_1: 'Acme', user_id: 1, owner_id: 2, mail: 'a@b.ch' });
  });

  it('clear-only update sends null for the cleared field, fills required fields and omits the rest', async () => {
    const spy = mockBodies([{ id: 7, contact_type_id: 1, name_1: 'Acme', user_id: 1, owner_id: 2, mail: 'old@b.ch', nr: '42' }, { id: 7 }]);
    await run({ action: bexioUpdateContact, propsValue: { contact_id: '7', clear_fields: 'mail_second, fax' } });
    const post = requestAt({ spy, index: 1 });
    expect(post.body).toEqual({ contact_type_id: 1, name_1: 'Acme', user_id: 1, owner_id: 2, mail_second: null, fax: null });
  });

  it('clear_fields accepts a list and combines with new values', async () => {
    const spy = mockBodies([{ id: 7, contact_type_id: 1, name_1: 'Acme', user_id: 1, owner_id: 2 }, { id: 7 }]);
    await run({ action: bexioUpdateContact, propsValue: { contact_id: '7', mail: 'a@b.ch', clear_fields: ['mail_second'] } });
    expect(requestAt({ spy, index: 1 }).body).toEqual({ contact_type_id: 1, name_1: 'Acme', user_id: 1, owner_id: 2, mail: 'a@b.ch', mail_second: null });
  });

  it('clear_fields rejects required, unknown or also-set fields before any request', async () => {
    const spy = mockBodies([]);
    await expect(run({ action: bexioUpdateContact, propsValue: { contact_id: '7', clear_fields: 'name_1' } })).rejects.toThrow('cannot be cleared');
    await expect(run({ action: bexioUpdateContact, propsValue: { contact_id: '7', clear_fields: 'foo' } })).rejects.toThrow('cannot be cleared');
    await expect(run({ action: bexioUpdateContact, propsValue: { contact_id: '7', clear_fields: 'nr' } })).rejects.toThrow('"nr" cannot be cleared');
    await expect(run({ action: bexioUpdateContact, propsValue: { contact_id: '7', mail: 'a@b.ch', clear_fields: 'mail' } })).rejects.toThrow('not both');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric id before any request', async () => {
    const spy = mockBodies([]);
    await expect(run({ action: bexioUpdateContact, propsValue: { contact_id: 'abc', mail: 'a@b.ch' } })).rejects.toThrow('Contact ID');
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps yes/no tri-states, keeps zero and omits empty fields', async () => {
    const spy = mockBodies([{ id: 3 }]);
    await run({ action: bexioUpdateItem, propsValue: { article_id: '3', html_text: 'x', width: 0, sale_price: '0.00', remarks: undefined } });
    expect(requestAt({ spy, index: 0 }).body).toEqual({ html_text: 'x', width: 0, sale_price: '0.00' });
  });

  it('update_person posts to the contact edit endpoint, not PATCH', async () => {
    const spy = mockBodies([{ id: 5, name_1: 'Doe', user_id: 1, owner_id: 1 }, { id: 5 }]);
    await run({ action: updatePersonAction, propsValue: { contact_id: 5, city: 'Bern' } });
    const post = requestAt({ spy, index: 1 });
    expect(post.method).toBe(HttpMethod.POST);
    expect(post.url).toBe('https://api.bexio.com/2.0/contact/5');
    expect(post.body).toEqual({ name_1: 'Doe', user_id: 1, owner_id: 1, contact_type_id: 2, city: 'Bern' });
  });

  it('update_product never sends is_stock and can set prices to 0', async () => {
    const spy = mockBodies([{ id: 9 }]);
    await run({ action: updateProductAction, propsValue: { article_id: 9, sale_price: 0, is_stock: true } });
    expect(requestAt({ spy, index: 0 }).body).toEqual({ sale_price: 0 });
  });

  it('bexio_update_item has no is_stock prop and refuses an empty update', async () => {
    expect(Object.keys(bexioUpdateItem.props)).not.toContain('is_stock');
    const spy = mockBodies([]);
    await expect(run({ action: bexioUpdateItem, propsValue: { article_id: '3' } })).rejects.toThrow('at least one field');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('documents and timesheets', () => {
  it('sends positions as an array and rejects malformed positions', async () => {
    const spy = mockBodies([{ id: 1 }]);
    await run({ action: bexioCreateInvoice, propsValue: { contact_id: '1', user_id: '2', positions: '[{"type":"KbPositionCustom","amount":"1"}]' } });
    expect(requestAt({ spy, index: 0 }).body).toEqual({ contact_id: 1, user_id: 2, positions: [{ type: 'KbPositionCustom', amount: '1' }] });
    await expect(run({ action: bexioCreateInvoice, propsValue: { contact_id: '1', user_id: '2', positions: '[1]' } })).rejects.toThrow('positions entry 1');
  });

  it('records a payment with an exact decimal value', async () => {
    const spy = mockBodies([{ id: 1 }]);
    await run({ action: bexioCreateInvoicePayment, propsValue: { invoice_id: '4', date: '2026-10-29', value: '100.05' } });
    const req = requestAt({ spy, index: 0 });
    expect(req.url).toBe('https://api.bexio.com/2.0/kb_invoice/4/payment');
    expect(req.body).toEqual({ date: '2026-10-29', value: '100.05' });
  });

  it('builds duration tracking for timesheets', async () => {
    const spy = mockBodies([{ id: 1 }]);
    await run({ action: bexioCreateTimesheet, propsValue: { user_id: '1', client_service_id: '2', allowable_bill: 'yes', tracking_type: 'duration', date: '2026-10-29', duration: '01:30' } });
    expect(requestAt({ spy, index: 0 }).body).toEqual({ user_id: 1, client_service_id: 2, allowable_bill: true, tracking: { type: 'duration', date: '2026-10-29', duration: '01:30' } });
  });

  it('uses the documented lifecycle paths', async () => {
    const spy = mockBodies([{ success: true }, { success: true }, { success: true }]);
    await run({ action: bexioRevertQuoteIssue, propsValue: { quote_id: '1' } });
    await run({ action: bexioDeclineQuote, propsValue: { quote_id: '1' } });
    await run({ action: bexioUnarchiveProject, propsValue: { project_id: '2' } });
    expect(spy.mock.calls.map((call) => call[0].url)).toEqual([
      'https://api.bexio.com/2.0/kb_offer/1/revertIssue',
      'https://api.bexio.com/2.0/kb_offer/1/reject',
      'https://api.bexio.com/2.0/pr_project/2/reactivate',
    ]);
  });
});

describe('live-test fixes', () => {
  it('copies all source positions when none are given', async () => {
    const spy = mockBodies([{ id: 1, positions: [{ id: 11, type: 'KbPositionCustom', amount: '2.000000' }, { id: 12, type: 'KbPositionText' }] }, { id: 50 }]);
    await run({ action: bexioCreateOrderFromQuote, propsValue: { quote_id: '1' } });
    expect(requestAt({ spy, index: 0 }).url).toBe('https://api.bexio.com/2.0/kb_offer/1');
    const post = requestAt({ spy, index: 1 });
    expect(post.url).toBe('https://api.bexio.com/2.0/kb_offer/1/order');
    expect(post.body).toEqual({ positions: [{ id: 11, type: 'KbPositionCustom', amount: 2 }, { id: 12, type: 'KbPositionText' }] });
  });

  it('passes given positions through without reading the source', async () => {
    const spy = mockBodies([{ id: 60 }]);
    await run({ action: bexioCreateInvoiceFromOrder, propsValue: { order_id: '3', positions: [{ id: 5, type: 'KbPositionArticle', amount: 1 }] } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(requestAt({ spy, index: 0 }).url).toBe('https://api.bexio.com/2.0/kb_order/3/invoice');
  });

  it('sends milestone_id and parent_milestone_id', async () => {
    const spy = mockBodies([{ id: 1 }, { id: 2 }]);
    await run({ action: bexioCreateWorkPackage, propsValue: { project_id: '4', name: 'WP', milestone_id: '7' } });
    await run({ action: bexioCreateMilestone, propsValue: { project_id: '4', name: 'M', parent_milestone_id: '8' } });
    expect(requestAt({ spy, index: 0 }).body).toEqual({ name: 'WP', milestone_id: 7 });
    expect(requestAt({ spy, index: 1 }).body).toEqual({ name: 'M', parent_milestone_id: 8 });
  });

  it('create_manual_entry posts to the accounting path', async () => {
    const spy = mockBodies([{ id: 1 }]);
    await run({ action: createManualEntryAction, propsValue: { type: 'manual_single_entry', date: '2026-10-29', entryFields: { debit_account: 1, credit_account: 2, amount: 10 } } });
    expect(requestAt({ spy, index: 0 }).url).toBe('https://api.bexio.com/3.0/accounting/manual_entries');
  });

  it('sends mwst_type as a number on documents', async () => {
    const spy = mockBodies([{ id: 1 }, { id: 2 }, { id: 3 }]);
    await run({ action: bexioCreateInvoice, propsValue: { contact_id: '1', user_id: '2', mwst_type: '0' } });
    await run({ action: bexioCreateQuote, propsValue: { contact_id: '1', user_id: '2', mwst_type: '1' } });
    await run({ action: bexioCreateOrder, propsValue: { contact_id: '1', user_id: '2', mwst_type: '2' } });
    expect(spy.mock.calls.map((call) => call[0].body)).toEqual([
      { contact_id: 1, user_id: 2, mwst_type: 0 },
      { contact_id: 1, user_id: 2, mwst_type: 1 },
      { contact_id: 1, user_id: 2, mwst_type: 2 },
    ]);
  });

  it('list_invoice_reminders returns all items without paging flags', async () => {
    mockBodies([[{ id: 1 }]]);
    const out = await run({ action: bexioListInvoiceReminders, propsValue: { invoice_id: '2' } });
    expect(out).toEqual({ items: [{ id: 1 }], count: 1 });
  });
});

describe('review fixes', () => {
  it('flags truncation when the last allowed page is still full', async () => {
    const full = Array.from({ length: 2000 }, (_, index) => ({ id: index }));
    const spy = mockBodies(Array.from({ length: 10 }, () => full));
    const all = await bexioAi.listAll({ auth: AUTH, path: '/2.0/accounts' });
    expect(spy).toHaveBeenCalledTimes(10);
    expect(all.truncated).toBe(true);
    expect(bexioAi.truncatedPlaceholder({ count: all.items.length })).toContain('Showing the first 20000');
  });

  it('refuses send without [Network Link] before any request', async () => {
    const spy = mockBodies([]);
    const props = { recipient_email: 'a@b.ch', subject: 'S', message: 'no link here' };
    await expect(run({ action: bexioSendInvoice, propsValue: { invoice_id: '1', ...props } })).rejects.toThrow('[Network Link]');
    await expect(run({ action: bexioSendQuote, propsValue: { quote_id: '1', ...props } })).rejects.toThrow('[Network Link]');
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends when the message has [Network Link]', async () => {
    const spy = mockBodies([{ success: true }]);
    await run({ action: bexioSendInvoice, propsValue: { invoice_id: '1', recipient_email: 'a@b.ch', subject: 'S', message: 'See [Network Link]' } });
    expect(requestAt({ spy, index: 0 }).url).toBe('https://api.bexio.com/2.0/kb_invoice/1/send');
  });

  it('rejects an in-list made only of commas', async () => {
    const spy = mockBodies([]);
    await expect(run({ action: bexioSearchContacts, propsValue: { field: 'id', criteria: 'in', value: ' , ,' } })).rejects.toThrow('Value is required');
    expect(spy).not.toHaveBeenCalled();
  });
});
