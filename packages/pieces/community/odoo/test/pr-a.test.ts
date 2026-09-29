import { beforeEach, describe, expect, it } from 'vitest';
import { createMockActionContext, createMockPollingTriggerContext } from '@activepieces/pieces-framework';
import { asRecord, asRecords, auth, AUTH_PROPS, callsTo, evalDomain, fake, fault, fieldsOf, firstArgList, kwCalls, memoryStore, resetFake, route, routeTable } from './fake-odoo';
import createContact from '../src/lib/actions/create-contact';
import createCompany from '../src/lib/actions/create-company';
import getRecords from '../src/lib/actions/get-records';
import createRecord from '../src/lib/actions/create-record';
import customOdooApiCall from '../src/lib/actions/custom-api-call';
import { odooAuth } from '../src/lib/auth';
import { OdooClient, odooRpc } from '../src/lib/common/client';
import { odooDates, odooDomain, odooInput, odooOutput } from '../src/lib/common/values';
import { odooOperations } from '../src/lib/common/operations';
import { odooPolling } from '../src/lib/common/polling';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { newOrUpdatedRecordTrigger } from '../src/lib/triggers/new-or-updated-record';
import { newSalesOrderTrigger } from '../src/lib/triggers/new-sales-order';
import { newContactTrigger } from '../src/lib/triggers/new-contact';
import { runRecordActionAction } from '../src/lib/actions/run-record-action';
import { createSalesOrderAction } from '../src/lib/actions/create-sales-order';
import { findInvoicesAction } from '../src/lib/actions/find-invoices';
import { attachFileAction } from '../src/lib/actions/attach-file';
import { saleOrderOutputSchema } from '../src/lib/output-schemas';


beforeEach(() => resetFake());

describe('F1/F2: create_contact and create_company (old Odoo class)', () => {
  it('F1 sends the real phone and email, not the name', async () => {
    route({ key: 'res.partner.search', handler: () => [] });
    route({ key: 'res.partner.create', handler: () => [55] });
    const out = await createContact.run(actionCtx({ propsValue: { name: 'Jane', phone: '+1 555', email: 'jane@x.com', company: 'Acme', title: 'Buyer' } }));
    const [create] = callsTo({ model: 'res.partner', method: 'create' });
    expect(create.args).toEqual([[{ name: 'Jane', phone: '+1 555', email: 'jane@x.com', company_name: 'Acme', function: 'Buyer' }]]);
    expect(out).toBe('Contact 55 created!');
  });

  it('F2 awaits the write and F2b never sends company_id on update', async () => {
    route({ key: 'res.partner.search', handler: () => [7] });
    route({ key: 'res.partner.write', handler: () => true });
    const out = await createContact.run(actionCtx({ propsValue: { name: 'Jane', phone: 'p', email: 'e', company: 'Acme', title: 't' } }));
    const [write] = callsTo({ model: 'res.partner', method: 'write' });
    expect(write.args[0]).toBe(7);
    expect(write.args[1]).not.toHaveProperty('company_id');
    expect(out).toBe('Contact 7 created!');
  });

  it('F2 a failed write is no longer reported as created (still returned, not thrown)', async () => {
    route({ key: 'res.partner.search', handler: () => [7] });
    route({ key: 'res.partner.write', handler: () => fault('ValidationError: bad email') });
    await expect(createCompany.run(actionCtx({ propsValue: { name: 'Acme', phone: 'p', email: 'e' } }))).resolves.toBe('Error');
  });
});

describe('F3: custom API call', () => {
  it('write sends values positionally', async () => {
    route({ key: 'res.partner.write', handler: () => true });
    await customOdooApiCall.run(actionCtx({ propsValue: { model: 'res.partner', method: 'write', method_params: { record_id: 5, values: { phone: '1' } } } }));
    const [call] = callsTo({ model: 'res.partner', method: 'write' });
    expect(call.raw.slice(5)).toEqual([[[5], { phone: '1' }]]);
  });

  it('fields_get sends empty args plus attributes', async () => {
    route({ key: 'res.partner.fields_get', handler: () => ({ name: { type: 'char' } }) });
    await customOdooApiCall.run(actionCtx({ propsValue: { model: 'res.partner', method: 'fields_get', method_params: { attributes: ['string', 'type'] } } }));
    const [call] = callsTo({ model: 'res.partner', method: 'fields_get' });
    expect(call.raw.slice(5)).toEqual([[], { attributes: ['string', 'type'] }]);
  });
});

describe('get_records order prop', () => {
  it('request is unchanged when order is empty', async () => {
    route({ key: 'res.partner.search_read', handler: () => [{ id: 1 }, { id: 2 }] });
    await getRecords.run(actionCtx({ propsValue: { model: 'res.partner', domain: [['is_company', '=', true]], fields: ['name'], offset: 0, limit: 5 } }));
    expect(callsTo({ model: 'res.partner', method: 'search_read' })[0].raw.slice(5)).toEqual([[[['is_company', '=', true]], ['name'], 0, 5]]);
  });

  it('appends order when set', async () => {
    route({ key: 'res.partner.search_read', handler: () => [{ id: 1 }, { id: 2 }] });
    await getRecords.run(actionCtx({ propsValue: { model: 'res.partner', domain: [], fields: ['name'], offset: 0, limit: 5, order: 'id desc' } }));
    expect(callsTo({ model: 'res.partner', method: 'search_read' })[0].raw.slice(5)).toEqual([[[], ['name'], 0, 5, 'id desc']]);
  });
});

describe('F4: optional port', () => {
  it('defaults to 443 for old actions, even with a port in the URL (compat)', async () => {
    route({ key: 'res.partner.create', handler: () => 9 });
    await createRecord.run(actionCtx({ propsValue: { model: 'res.partner', fields: { name: 'x' } }, extra: { base_url: 'http://localhost:8069' } }));
    expect(fake.state.calls.every((c) => c.port === 443 && c.host === 'localhost' && c.secure === false)).toBe(true);
  });

  it('uses the port prop when set, for old actions and the new client', async () => {
    route({ key: 'res.partner.create', handler: () => 9 });
    await createRecord.run(actionCtx({ propsValue: { model: 'res.partner', fields: { name: 'x' } }, extra: { base_url: 'http://localhost', port: 8069 } }));
    expect(fake.state.calls.every((c) => c.port === 8069)).toBe(true);
    resetFake();
    await OdooClient.fromAuth({ auth: { ...AUTH_PROPS, port: '8443' } }).authenticate();
    expect(fake.state.calls[0]).toMatchObject({ port: 8443, secure: true, host: 'acme.odoo.com', path: '/xmlrpc/2/common' });
  });

  it('validates the port and the URL', () => {
    expect(odooRpc.resolvePort(undefined)).toBe(443);
    expect(odooRpc.resolvePort(null)).toBe(443);
    expect(odooRpc.resolvePort('')).toBe(443);
    expect(() => odooRpc.resolvePort(70000)).toThrow(/Invalid Odoo port/);
    expect(() => odooRpc.resolvePort('abc')).toThrow(/Invalid Odoo port/);
    expect(() => odooRpc.resolveConnection({ ...AUTH_PROPS, base_url: 'ftp://x' })).toThrow(/https/);
    expect(() => odooRpc.resolveConnection({ ...AUTH_PROPS, base_url: 'https://u:p@x.com' })).toThrow(/user name/);
  });

  it('validate() uses the port and reports bad logins as invalid credentials', async () => {
    fake.state.authUid = false;
    const bad = await odooAuth.validate?.({ auth: { ...AUTH_PROPS, port: 8069 } });
    expect(bad).toEqual({ valid: false, error: expect.stringMatching(/Invalid credentials/) });
    expect(fake.state.calls[0].port).toBe(8069);
    fake.state.authUid = 2;
    await expect(odooAuth.validate?.({ auth: AUTH_PROPS })).resolves.toEqual({ valid: true });
    expect(fake.state.calls[1].port).toBe(443);
  });
});

describe('new client request shape', () => {
  it('never sends undefined and never unwraps arrays', async () => {
    route({ key: 'res.partner.search_read', handler: () => [{ id: 1 }] });
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    const rows = await client.call({ model: 'res.partner', method: 'search_read', args: [[]], kwargs: { fields: ['id'], limit: undefined, order: undefined } });
    expect(rows).toEqual([{ id: 1 }]);
    expect(kwCalls()[0].kwargs).toEqual({ fields: ['id'] });
    expect(() => odooRpc.cleanValue({ a: Number.NaN })).toThrow();
    expect(odooRpc.cleanValue([1, undefined, { b: undefined, c: 2 }])).toEqual([1, null, { c: 2 }]);
  });

  it('throws a short Odoo error instead of returning it', async () => {
    route({ key: 'res.partner.read', handler: () => fault('odoo.exceptions.MissingError: Record does not exist or has been deleted.') });
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    await expect(client.call({ model: 'res.partner', method: 'read', args: [[99]] })).rejects.toThrow(
      'Odoo res.partner.read failed: odoo.exceptions.MissingError: Record does not exist or has been deleted.',
    );
  });

  it('treats "cannot marshal None" as success only where allowed', async () => {
    route({ key: 'crm.lead.action_archive', handler: () => fault('TypeError: cannot marshal None unless allow_none is enabled') });
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    await expect(client.callAllowNone({ model: 'crm.lead', method: 'action_archive', args: [[1]] })).resolves.toEqual({ value: null, returnedNone: true });
    await expect(client.call({ model: 'crm.lead', method: 'action_archive', args: [[1]] })).rejects.toThrow(/cannot marshal None/);
    const out = await runRecordActionAction.run(actionCtx({ propsValue: { model: 'crm.lead', record_id: 1, method: 'action_archive' } }));
    expect(out).toMatchObject({ returned_none: true, result: null, record_ids: [1] });
  });

  it('refuses private or odd method names', () => {
    expect(() => odooInput.toMethodName('_compute')).toThrow();
    expect(() => odooInput.toMethodName('a b')).toThrow();
    expect(odooInput.toMethodName('action_confirm')).toBe('action_confirm');
  });
});

describe('domains', () => {
  it('parses arrays and JSON strings and rejects bad shapes', () => {
    expect(odooDomain.parseDomain({ value: '[["a","=",1],"|",["b","=",2],["c","=",3]]' })).toEqual([['a', '=', 1], '|', ['b', '=', 2], ['c', '=', 3]]);
    expect(odooDomain.parseDomain({ value: undefined })).toEqual([]);
    expect(() => odooDomain.parseDomain({ value: '{"a":1}' })).toThrow(/list/);
    expect(() => odooDomain.parseDomain({ value: [['a', '=']] })).toThrow(/item 1/);
    expect(() => odooDomain.parseDomain({ value: 'not json' })).toThrow(/JSON/);
  });

  it('ANDs domains that use implicit AND and prefix operators', () => {
    const user = odooDomain.parseDomain({ value: [['a', '=', 1], ['b', '=', 2]] });
    const cursor = ['|', ['d', '>', 'x'], '&', ['d', '=', 'x'], ['id', '>', 3]];
    const out = odooDomain.andDomains([user, [...cursor]]);
    expect(out).toEqual(['&', '&', ['a', '=', 1], ['b', '=', 2], '|', ['d', '>', 'x'], '&', ['d', '=', 'x'], ['id', '>', 3]]);
    expect(odooDomain.andDomains([[], [['a', '=', 1]]])).toEqual([['a', '=', 1]]);
    expect(odooDomain.orConditions([['a', '=', 1], ['b', '=', 2], ['c', '=', 3]])).toEqual(['|', '|', ['a', '=', 1], ['b', '=', 2], ['c', '=', 3]]);
  });

  it('builds the invoice domain', () => {
    const domain = odooOperations.invoiceDomain({
      move_types: ['out_invoice'],
      state: 'posted',
      payment_states: ['not_paid', 'partial'],
      partner_id: 7,
      due_date_to: '2026-09-28T23:00:00Z',
      number: 'INV/2026',
    });
    expect(domain).toEqual([
      '&', '&', '&', '&', '&',
      ['move_type', 'in', ['out_invoice']],
      ['state', '=', 'posted'],
      ['payment_state', 'in', ['not_paid', 'partial']],
      ['partner_id', 'child_of', 7],
      ['invoice_date_due', '<=', '2026-09-28'],
      '|', '|', ['name', 'ilike', 'INV/2026'], ['ref', 'ilike', 'INV/2026'], ['payment_reference', 'ilike', 'INV/2026'],
    ]);
  });
});

describe('dates are UTC regardless of the process time zone', () => {
  it('runs under a non-UTC TZ', () => {
    expect(new Date(Date.UTC(2026, 0, 1)).getTimezoneOffset()).not.toBe(0);
  });

  it('formats and parses Odoo naive UTC strings', () => {
    const epoch = Date.UTC(2026, 8, 29, 7, 5, 9);
    expect(odooDates.toOdooDatetime(epoch)).toBe('2026-09-29 07:05:09');
    expect(odooDates.parseOdooDatetime('2026-09-29 07:05:09')).toBe(epoch);
    expect(odooDates.inputToOdooDatetime({ value: '2026-09-29T09:05:09+02:00', label: 'x' })).toBe('2026-09-29 07:05:09');
    expect(odooDates.inputToOdooDatetime({ value: '2026-09-29 07:05:09', label: 'x' })).toBe('2026-09-29 07:05:09');
    expect(odooDates.inputToOdooDate({ value: '2026-09-29T23:30:00.000Z', label: 'x' })).toBe('2026-09-29');
    expect(() => odooDates.inputToOdooDatetime({ value: 'tomorrow', label: 'When' })).toThrow(/When/);
  });
});

describe('output normalisation', () => {
  it('splits many2one, keeps booleans, maps false to null', () => {
    const fields = fieldsOf({ partner_id: 'many2one', is_company: 'boolean', email: 'char', tag_ids: 'many2many' });
    expect(
      odooOutput.normalizeRecord({ record: { id: 1, partner_id: [7, 'Acme'], is_company: false, email: false, tag_ids: [1, 2] }, fields }),
    ).toEqual({ id: 1, partner_id: 7, partner_id_name: 'Acme', is_company: false, email: null, tag_ids: [1, 2] });
    expect(odooOutput.normalizeRecord({ record: { partner_id: false }, fields })).toEqual({ partner_id: null, partner_id_name: null });
  });
});

describe('polling triggers: date + ids-at-date cursor', () => {
  const partnerFields = fieldsOf({ name: 'char', create_date: 'datetime', write_date: 'datetime', image_1920: 'binary' });
  const orderFields = fieldsOf({ name: 'char', state: 'selection', date_order: 'datetime', create_date: 'datetime', write_date: 'datetime' });
  const S = '2026-09-29 10:00:00';

  it('onEnable takes the cursor from the newest Odoo record, with every id in that second', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [
      { id: 44, stamp: `${S}.100000`, values: {} },
      { id: 40, stamp: `${S}.900000`, values: {} },
      { id: 12, stamp: '2026-09-29 09:59:59.000000', values: {} },
    ] });
    const store = memoryStore();
    await newRecordTrigger.onEnable(triggerCtx({ propsValue: { model: 'res.partner' }, store }));
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: S, idsAtDate: [40, 44] });
    const calls = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(calls[0].kwargs).toMatchObject({ order: 'create_date desc, id desc', limit: 1 });
    expect(calls[1].args[0]).toEqual([['create_date', '>=', S], ['create_date', '<', '2026-09-29 10:00:01']]);
  });

  it('keeps the cursor on republish', async () => {
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-01-01 00:00:00', idsAtDate: [1] });
    await newRecordTrigger.onEnable(triggerCtx({ propsValue: { model: 'res.partner' }, store, isRepublish: true }));
    expect(kwCalls()).toHaveLength(0);
  });

  it('reads field >= date, skips the ids already seen at that date, and orders by date then id', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [{ id: 9, stamp: `${S}.2`, values: { is_company: true } }] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, idsAtDate: [5, 7] });
    const out = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner', domain: [['is_company', '=', true]] }, store })));
    expect(out.map((r) => r['id'])).toEqual([9]);
    const [call] = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(call.args[0]).toEqual([
      '&', '&',
      ['is_company', '=', true],
      ['create_date', '>=', S],
      '|', ['create_date', '>=', '2026-09-29 10:00:01'], ['id', 'not in', [5, 7]],
    ]);
    expect(call.kwargs).toMatchObject({ order: 'create_date asc, id asc', limit: 100 });
    expect(call.kwargs['fields']).not.toContain('image_1920');
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: S, idsAtDate: [5, 7, 9] });
  });

  it('emits an update to a LOWER id in the cursor second exactly once', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = [
      { id: 3, stamp: '2026-09-29 09:00:00.000000', values: { name: 'old' } },
      { id: 50, stamp: `${S}.100000`, values: { name: 'emitted before' } },
    ];
    routeTable({ model: 'res.partner', dateField: 'write_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, idsAtDate: [50] });
    rows[0].stamp = `${S}.800000`;
    const first = asRecords(await newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(first.map((r) => r['id'])).toEqual([3]);
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: S, idsAtDate: [50, 3] });
    await expect(newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('does not lose or repeat two records of the same second split by a page boundary', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [
      { id: 1, stamp: '2026-09-29 09:59:59.000000', values: {} },
      { id: 30, stamp: `${S}.100000`, values: {} },
      { id: 20, stamp: `${S}.700000`, values: {} },
    ] });
    const source = { model: 'res.partner', dateField: 'create_date', domain: [] };
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    const start = { date: '2026-09-29 09:00:00', idsAtDate: [] };
    const first = await odooPolling.pollAfter({ client, source, cursor: start, pageSize: 2 });
    expect(first.records.map((r) => r['id'])).toEqual([1, 30, 20]);
    expect(first.cursor).toEqual({ date: S, idsAtDate: [30, 20] });
    const again = await odooPolling.pollAfter({ client, source, cursor: first.cursor, pageSize: 2 });
    expect(again.records).toEqual([]);
    expect(again.cursor).toEqual(first.cursor);
  });

  it('emits a 120-record bulk in one second once, across pages, and re-polls to 0', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = Array.from({ length: 120 }, (_, i) => ({ id: 1000 - i, stamp: `${S}.${String(i).padStart(6, '0')}`, values: { name: `bulk ${i}` } }));
    routeTable({ model: 'res.partner', dateField: 'create_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-29 09:00:00', idsAtDate: [] });
    const first = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(first).toHaveLength(120);
    expect(new Set(first.map((r) => r['id']))).toEqual(new Set(rows.map((r) => r.id)));
    expect(callsTo({ model: 'res.partner', method: 'search_read' })).toHaveLength(2);
    const cursor = readStoredCursor(store);
    expect(cursor.date).toBe(S);
    expect(cursor.idsAtDate).toHaveLength(120);
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('never re-emits records whose stored date has microseconds, and stops after 5 pages of 100', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = [
      ...Array.from({ length: 120 }, (_, i) => ({ id: 10 + i, stamp: `${S}.500000`, values: { name: `bulk ${i}` } })),
      { id: 7, stamp: `${S}.900000`, values: { name: 'late commit, lower id' } },
      { id: 200, stamp: '2026-09-29 10:00:01.100000', values: { name: 'next second' } },
      ...Array.from({ length: 430 }, (_, i) => ({ id: 300 + i, stamp: `2026-09-29 1${1 + Math.floor(i / 60)}:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.${String(i).padStart(6, '0')}`, values: { name: `spread ${i}` } })),
    ];
    routeTable({ model: 'res.partner', dateField: 'create_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '1970-01-01 00:00:00', idsAtDate: [] });
    const first = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(first).toHaveLength(500);
    const second = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    const ids = [...first, ...second].map((r) => r['id']);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(rows.map((r) => r.id)));
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('does not move the cursor when nothing is new', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    route({ key: 'res.partner.search_read', handler: () => [] });
    const store = memoryStore();
    const cursor = { date: S, idsAtDate: [5] };
    await store.put(odooPolling.CURSOR_KEY, cursor);
    await expect(newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual(cursor);
    expect(JSON.stringify(callsTo({ model: 'res.partner', method: 'search_read' })[0].args)).toContain('write_date');
  });

  it('first run without a cursor, or with an old-format cursor, only stores one and emits nothing', async () => {
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [{ id: 3, stamp: '2026-09-29 09:00:00.250000', values: {} }] });
    const store = memoryStore();
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: '2026-09-29 09:00:00', idsAtDate: [3] });
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-29 09:00:00', id: 3 });
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: '2026-09-29 09:00:00', idsAtDate: [3] });
  });

  it('confirmed-order mode polls write_date on sale/done; quotation mode polls create_date with no state filter', async () => {
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    route({ key: 'sale.order.search_read', handler: () => [] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, idsAtDate: [] });
    await newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store }));
    await newSalesOrderTrigger.run(triggerCtx({ propsValue: { order_state: 'draft' }, store }));
    const [confirmed, quotation] = callsTo({ model: 'sale.order', method: 'search_read' }).map((call) => call.args[0]);
    expect(confirmed).toEqual(['&', ['state', 'in', ['sale', 'done']], ['write_date', '>=', S]]);
    expect(quotation).toEqual([['create_date', '>=', S]]);
  });

  it('fires once for an order confirmed with an old date_order, and not again when it is edited later', async () => {
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    const rows = [
      { id: 5, stamp: '2026-09-20 08:00:00.000000', values: { name: 'S00005', state: 'sale', date_order: '2026-09-20 08:00:00' } },
      { id: 8, stamp: '2026-09-28 12:00:00.000000', values: { name: 'S00008', state: 'draft', date_order: '2026-09-01 09:00:00' } },
    ];
    routeTable({ model: 'sale.order', dateField: 'write_date', rows });
    const store = memoryStore();
    await newSalesOrderTrigger.onEnable(triggerCtx({ propsValue: {}, store }));
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: '2026-09-20 08:00:00', idsAtDate: [5] });
    expect(store.data.get(odooPolling.EMITTED_KEY)).toEqual([5]);
    rows[1].values = { ...rows[1].values, state: 'sale' };
    rows[1].stamp = `${S}.300000`;
    const first = asRecords(await newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store })));
    expect(first.map((r) => r['id'])).toEqual([8]);
    expect(first[0]).toMatchObject({ date_order: '2026-09-01 09:00:00' });
    rows[1].stamp = '2026-09-29 11:00:00.000000';
    rows[0].stamp = '2026-09-29 11:00:05.000000';
    await expect(newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.EMITTED_KEY)).toEqual([5, 8]);
    await newSalesOrderTrigger.onDisable(triggerCtx({ propsValue: {}, store }));
    expect(store.data.size).toBe(0);
  });

  it('keeps only the last 2,000 fired order ids', async () => {
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    routeTable({ model: 'sale.order', dateField: 'write_date', rows: [{ id: 9001, stamp: `${S}.1`, values: { state: 'sale' } }] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-29 09:00:00', idsAtDate: [] });
    await store.put(odooPolling.EMITTED_KEY, Array.from({ length: odooPolling.MAX_EMITTED }, (_, i) => i + 1));
    const out = asRecords(await newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store })));
    expect(out.map((r) => r['id'])).toEqual([9001]);
    const emitted = store.data.get(odooPolling.EMITTED_KEY);
    expect(Array.isArray(emitted) && emitted.length).toBe(odooPolling.MAX_EMITTED);
    expect(Array.isArray(emitted) && emitted[emitted.length - 1]).toBe(9001);
  });

  it('quotation mode fires once for a quotation that was already sent or confirmed before the poll', async () => {
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    const rows = [
      { id: 2, stamp: '2026-09-28 10:00:00.000000', values: { name: 'S00002', state: 'draft' } },
      { id: 3, stamp: `${S}.100000`, values: { name: 'S00003', state: 'sent' } },
      { id: 4, stamp: `${S}.200000`, values: { name: 'S00004', state: 'sale' } },
    ];
    routeTable({ model: 'sale.order', dateField: 'create_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-28 10:00:00', idsAtDate: [2] });
    const out = asRecords(await newSalesOrderTrigger.run(triggerCtx({ propsValue: { order_state: 'draft' }, store })));
    expect(out.map((r) => [r['id'], r['state']])).toEqual([[3, 'sent'], [4, 'sale']]);
    await expect(newSalesOrderTrigger.run(triggerCtx({ propsValue: { order_state: 'draft' }, store }))).resolves.toEqual([]);
  });

  it('contact trigger pads fields missing on this Odoo version', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', is_company: 'boolean', create_date: 'datetime', parent_id: 'many2one' }) });
    route({ key: 'res.partner.search_read', handler: () => [{ id: 1, name: 'A', is_company: true, create_date: '2026-09-29 10:00:00', parent_id: false }] });
    const out = asRecords(await newContactTrigger.test(triggerCtx({ propsValue: { contact_type: 'company' }, store: memoryStore() })));
    expect(out[0]).toMatchObject({ id: 1, is_company: true, mobile: null, parent_id: null, parent_id_name: null, country_id_name: null });
    expect(Object.keys(out[0]).slice(0, 10)).toEqual(['id', 'display_name', 'name', 'is_company', 'parent_id', 'parent_id_name', 'email', 'phone', 'mobile', 'website']);
    expect(Object.keys(out[0]).slice(-5)).toEqual(['company_name', 'lang', 'active', 'create_date', 'write_date']);
    expect(callsTo({ model: 'res.partner', method: 'search_read' })[0].args[0]).toEqual([['is_company', '=', true]]);
  });
});

describe('new human actions', () => {
  it('create_sales_order resolves internal references and sends only given line values', async () => {
    routeProducts([{ id: 31, default_code: 'FURN_7800' }, { id: 44, default_code: false }]);
    route({ key: 'sale.order.create', handler: () => 12 });
    route({ key: 'sale.order.fields_get', handler: () => fieldsOf({ name: 'char', partner_id: 'many2one', state: 'selection' }) });
    route({ key: 'sale.order.read', handler: () => [{ id: 12, name: 'S00012', partner_id: [7, 'Acme'], state: 'draft' }] });
    const out = await createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: [{ product: 'FURN_7800', quantity: 2 }, { product: '44' }] } }));
    const [create] = callsTo({ model: 'sale.order', method: 'create' });
    expect(create.args).toEqual([{ partner_id: 7, order_line: [[0, 0, { product_id: 31, product_uom_qty: 2 }], [0, 0, { product_id: 44, product_uom_qty: 1 }]] }]);
    expect(out).toMatchObject({ id: 12, partner_id: 7, partner_id_name: 'Acme', amount_total: null });
  });

  it('create_sales_order accepts lines as a JSON string and refuses bad lines instead of dropping them', async () => {
    routeProducts([{ id: 31, default_code: 'FURN_7800' }]);
    route({ key: 'sale.order.create', handler: () => 12 });
    route({ key: 'sale.order.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'sale.order.read', handler: () => [{ id: 12, name: 'S00012' }] });
    await createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: '[{"product": "FURN_7800", "quantity": 3}]' } }));
    expect(callsTo({ model: 'sale.order', method: 'create' })[0].args).toEqual([{ partner_id: 7, order_line: [[0, 0, { product_id: 31, product_uom_qty: 3 }]] }]);
    await expect(createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: '{"product": "FURN_7800"}' } }))).rejects.toThrow(/Order Lines must be a JSON list/);
    await expect(createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: 'not json' } }))).rejects.toThrow(/Order Lines must be JSON/);
    await expect(createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: [{ product: 'FURN_7800' }, 'FURN_7800'] } }))).rejects.toThrow(/line 2 must be an object/);
    await expect(createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: [] } }))).rejects.toThrow(/at least one order line/);
    expect(callsTo({ model: 'sale.order', method: 'create' })).toHaveLength(1);
  });

  it('a failed read-back after a create names the created record and says not to retry', async () => {
    routeProducts([{ id: 31, default_code: 'FURN_7800' }]);
    route({ key: 'sale.order.create', handler: () => 12 });
    route({ key: 'crm.lead.create', handler: () => 17 });
    route({ key: 'ir.attachment.create', handler: () => 90 });
    route({ key: '*.fields_get', handler: () => fault('AccessError: no read access') });
    await expect(createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: [{ product: 'FURN_7800' }] } }))).rejects.toThrow(
      /^Sales order 12 \(sale\.order\) was created, but reading it back failed: .*AccessError: no read access.*\. Do not retry the create; use Get Records with id 12\.$/s,
    );
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    await expect(odooOperations.createLead({ client, values: { name: 'Chairs' } })).rejects.toThrow(
      /^Lead 17 \(crm\.lead\) was created, but reading it back failed: .*Do not retry the create; use Get Records with id 17\.$/s,
    );
    route({ key: '*.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'ir.attachment.read', handler: () => [] });
    await expect(odooOperations.attachFile({ client, model: 'sale.order', recordId: 12, file: { data: Buffer.from('PDF'), filename: 'a.pdf' } })).rejects.toThrow(
      'Attachment 90 (ir.attachment) was created, but reading it back failed: ir.attachment record 90 was not found. Do not retry the create; use Get Records with id 90.',
    );
    expect(callsTo({ model: 'sale.order', method: 'create' })).toHaveLength(1);
    expect(callsTo({ model: 'crm.lead', method: 'create' })).toHaveLength(1);
  });

  it('resolveProduct: numbers are IDs, strings are internal references first, then IDs', async () => {
    routeProducts([
      { id: 31, default_code: 'FURN_7800' },
      { id: 44, default_code: false },
      { id: 50, default_code: '777' },
      { id: 60, default_code: '44' },
      { id: 70, default_code: '70' },
    ]);
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    await expect(odooOperations.resolveProduct({ client, value: 44 })).resolves.toBe(44);
    expect(callsTo({ model: 'product.product', method: 'search' })).toHaveLength(0);
    await expect(odooOperations.resolveProduct({ client, value: 'FURN_7800' })).resolves.toBe(31);
    await expect(odooOperations.resolveProduct({ client, value: '777' })).resolves.toBe(50);
    await expect(odooOperations.resolveProduct({ client, value: '31' })).resolves.toBe(31);
    await expect(odooOperations.resolveProduct({ client, value: '70' })).resolves.toBe(70);
    await expect(odooOperations.resolveProduct({ client, value: '44' })).rejects.toThrow(
      'Product: "44" is the internal reference of product 60 and also the ID of product 44. Pass the ID as a number, or use the internal reference of the product you mean.',
    );
    await expect(odooOperations.resolveProduct({ client, value: '999' })).rejects.toThrow('Product: no product with ID or internal reference "999".');
    await expect(odooOperations.resolveProduct({ client, value: 'NOPE' })).rejects.toThrow('Product: no product with ID or internal reference "NOPE".');
    await expect(odooOperations.resolveProduct({ client, value: ' ' })).rejects.toThrow('Product: enter a product ID or internal reference.');
    await expect(odooOperations.resolveProduct({ client, value: 4.5 })).rejects.toThrow(/positive whole number/);
    const domains = callsTo({ model: 'product.product', method: 'search' }).map((call) => firstArgList(call));
    expect(domains).toContainEqual([['id', '=', 31]]);
    expect(domains.filter((domain) => JSON.stringify(domain).includes('"id"'))).toHaveLength(5);
  });

  it('names the order line when its product cannot be resolved', async () => {
    routeProducts([{ id: 31, default_code: 'FURN_7800' }]);
    await expect(
      createSalesOrderAction.run(
        actionCtx({ propsValue: { partner_id: 7, lines: [{ product: 'FURN_7800' }, { product: 'MISSING' }] } }),
      ),
    ).rejects.toThrow('Line 2 product: no product with ID or internal reference "MISSING".');
  });

  it('refuses two products with the same internal reference', async () => {
    routeProducts([{ id: 1, default_code: 'DUP' }, { id: 2, default_code: 'DUP' }]);
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    await expect(odooOperations.resolveProduct({ client, value: 'DUP' })).rejects.toThrow('Product: more than one product has the internal reference "DUP". Use the product ID.');
  });

  it('many2one output fields keep the ID and name pair', () => {
    expect(saleOrderOutputSchema.fields).toEqual(
      expect.arrayContaining([
        { key: 'partner_id', label: 'Customer ID', format: 'number' },
        { key: 'partner_id_name', label: 'Customer' },
      ]),
    );
  });

  it('find_invoices pages with limit+1', async () => {
    route({ key: 'account.move.fields_get', handler: () => fieldsOf({ name: 'char', state: 'selection', partner_id: 'many2one' }) });
    route({ key: 'account.move.search_read', handler: (call) => Array.from({ length: Number(call.kwargs['limit']) }, (_, i) => ({ id: i + 1, name: `INV/${i}`, partner_id: false, state: 'posted' })) });
    const out = asRecord(await findInvoicesAction.run(actionCtx({ propsValue: { limit: 2 } })));
    expect(out).toMatchObject({ count: 2, has_more: true, next_offset: 2, limit: 2 });
    expect(callsTo({ model: 'account.move', method: 'search_read' })[0].kwargs['limit']).toBe(3);
  });

  it('attach_file duck-types the file and links it to the record', async () => {
    route({ key: 'ir.attachment.create', handler: () => 5 });
    route({ key: 'ir.attachment.fields_get', handler: () => fieldsOf({ name: 'char', res_model: 'char', res_id: 'integer' }) });
    route({ key: 'ir.attachment.read', handler: () => [{ id: 5, name: 'a.pdf', res_model: 'sale.order', res_id: 12 }] });
    await attachFileAction.run(actionCtx({ propsValue: { model: 'sale.order', record_id: 12, file: { filename: 'a.pdf', data: Buffer.from('PDF') } } }));
    expect(callsTo({ model: 'ir.attachment', method: 'create' })[0].args).toEqual([{ name: 'a.pdf', datas: Buffer.from('PDF').toString('base64'), res_model: 'sale.order', res_id: 12 }]);
  });
});

function routeProducts(products: Record<string, unknown>[]) {
  route({
    key: 'product.product.search',
    handler: (call) =>
      products
        .filter((record) => evalDomain({ record, domain: firstArgList(call) }))
        .slice(0, Number(call.kwargs['limit'] ?? products.length))
        .map((record) => record['id']),
  });
}

function readStoredCursor(store: ReturnType<typeof memoryStore>): { date: unknown; idsAtDate: unknown[] } {
  const value = store.data.get(odooPolling.CURSOR_KEY);
  const record = asRecord(value);
  const ids = record['idsAtDate'];
  return { date: record['date'], idsAtDate: Array.isArray(ids) ? ids : [] };
}

function actionCtx({ propsValue, extra = {} }: ActionCtxParams) {
  return { ...createMockActionContext({ propsValue }), auth: auth(extra) };
}

function triggerCtx({ propsValue, store, isRepublish }: TriggerCtxParams) {
  return { ...createMockPollingTriggerContext({ propsValue }), auth: auth(), store, isRepublish };
}

type ActionCtxParams = { propsValue: Record<string, unknown>; extra?: Record<string, unknown> };

type TriggerCtxParams = { propsValue: Record<string, unknown>; store: ReturnType<typeof memoryStore>; isRepublish?: boolean };
