import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { newLeadTrigger } from '../src/lib/triggers/new-lead';
import { runRecordActionAction } from '../src/lib/actions/run-record-action';
import { createSalesOrderAction } from '../src/lib/actions/create-sales-order';
import { findInvoicesAction } from '../src/lib/actions/find-invoices';
import { attachFileAction } from '../src/lib/actions/attach-file';
import { createdAttachmentOutputSchema, createdLeadOutputSchema, createdSaleOrderOutputSchema, saleOrderOutputSchema } from '../src/lib/output-schemas';


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

  it('validate() refuses a URL with a port and points to the Port field', async () => {
    await expect(odooAuth.validate?.({ auth: { ...AUTH_PROPS, base_url: 'http://localhost:8069' } })).resolves.toEqual({
      valid: false,
      error: 'Remove ":8069" from the URL. Set Port only if Odoo is not reachable on 443 (today the port in the URL is ignored).',
    });
    expect(fake.state.calls).toHaveLength(0);
    await expect(odooAuth.validate?.({ auth: { ...AUTH_PROPS, base_url: 'https://acme.odoo.com/', port: 8443 } })).resolves.toEqual({ valid: true });
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

  it('refuses private, odd and generic CRUD or environment method names, naming the dedicated action', async () => {
    const actions = { delete: 'Delete Record', update: 'Custom Update Record', create: 'Custom Create Record', read: 'Get Record' };
    expect(() => odooInput.toMethodName({ value: '_compute', actions })).toThrow(/"_"/);
    expect(() => odooInput.toMethodName({ value: 'a b', actions })).toThrow();
    expect(odooInput.toMethodName({ value: 'action_confirm', actions })).toBe('action_confirm');
    expect(() => odooInput.toMethodName({ value: 'unlink', actions })).toThrow('"unlink" cannot be called here. Use Delete Record to delete records.');
    expect(() => odooInput.toMethodName({ value: 'write', actions })).toThrow('Use Custom Update Record to change field values.');
    expect(() => odooInput.toMethodName({ value: 'create', actions })).toThrow('Use Custom Create Record to create records.');
    expect(() => odooInput.toMethodName({ value: 'copy', actions })).toThrow(/Use Custom Create Record/);
    expect(() => odooInput.toMethodName({ value: 'browse', actions })).toThrow('Use Get Record to read records.');
    expect(() => odooInput.toMethodName({ value: 'update', actions })).toThrow('"update" cannot be called here. Use Custom Update Record to change field values.');
    expect(() => odooInput.toMethodName({ value: 'name_create', actions })).toThrow('"name_create" cannot be called here. Use Custom Create Record to create records.');
    expect(() => odooInput.toMethodName({ value: 'load', actions })).toThrow('"load" cannot be called here. Use Custom Create Record to create records.');
    expect(() => odooInput.toMethodName({ value: 'Web_Save', actions })).toThrow('"Web_Save" cannot be called here. Use Custom Update Record to change field values, or Custom Create Record to create records.');
    expect(odooInput.toMethodName({ value: 'name_search', actions })).toBe('name_search');
    for (const value of ['sudo', 'with_user', 'with_context', 'with_env', 'SUDO']) {
      expect(() => odooInput.toMethodName({ value, actions })).toThrow(/changes the user or environment/);
    }
    await expect(runRecordActionAction.run(actionCtx({ propsValue: { model: 'res.partner', record_id: 1, method: 'unlink' } }))).rejects.toThrow('Use Delete Record to delete records.');
    expect(kwCalls()).toHaveLength(0);
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

describe('polling triggers: 5-minute look-back cursor', () => {
  const partnerFields = fieldsOf({ name: 'char', active: 'boolean', create_date: 'datetime', write_date: 'datetime', image_1920: 'binary' });
  const orderFields = fieldsOf({ name: 'char', state: 'selection', date_order: 'datetime', create_date: 'datetime', write_date: 'datetime' });
  const leadFields = fieldsOf({ name: 'char', type: 'selection', team_id: 'many2one', date_conversion: 'datetime', create_date: 'datetime', write_date: 'datetime' });
  const S = '2026-09-29 10:00:00';
  const LOOK = '2026-09-29 09:55:00';

  afterEach(() => vi.useRealTimers());

  it('onEnable takes the cursor from the newest Odoo record, with every id in that second', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [
      { id: 44, stamp: `${S}.100000`, values: {} },
      { id: 40, stamp: `${S}.900000`, values: {} },
      { id: 12, stamp: '2026-09-29 09:59:59.000000', values: {} },
    ] });
    const store = memoryStore();
    await newRecordTrigger.onEnable(triggerCtx({ propsValue: { model: 'res.partner' }, store }));
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: S, floor: { date: S, id: 0 }, emitted: [{ id: 40, date: S }, { id: 44, date: S }] });
    const calls = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(calls[0].kwargs).toMatchObject({ order: 'create_date desc, id desc', limit: 1 });
    expect(calls[1].args[0]).toEqual([['create_date', '>=', S], ['create_date', '<', '2026-09-29 10:00:01']]);
  });

  it('keeps the cursor on republish', async () => {
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-01-01 00:00:00', floor: null, emitted: [{ id: 1, date: '2026-01-01 00:00:00' }] });
    await newRecordTrigger.onEnable(triggerCtx({ propsValue: { model: 'res.partner' }, store, isRepublish: true }));
    expect(kwCalls()).toHaveLength(0);
  });

  it('reads 5 minutes back, skips what it already emitted in that window, and orders by date then id', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [{ id: 9, stamp: `${S}.2`, values: { is_company: true } }] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted: [{ id: 5, date: S }, { id: 7, date: S }] });
    const out = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner', domain: [['is_company', '=', true]] }, store })));
    expect(out.map((r) => r['id'])).toEqual([9]);
    const [call] = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(call.args[0]).toEqual([
      '&',
      ['is_company', '=', true],
      '&',
      ['create_date', '>=', LOOK],
      '|', ['id', 'not in', [5, 7]], ['create_date', '>=', '2026-09-29 10:00:01'],
    ]);
    expect(call.kwargs).toMatchObject({ order: 'create_date asc, id asc', limit: 100 });
    expect(call.kwargs['fields']).not.toContain('image_1920');
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual({ date: S, floor: null, emitted: [{ id: 5, date: S }, { id: 7, date: S }, { id: 9, date: S }] });
  });

  it('emits a row stamped 90 s in the past that commits after the cursor moved, exactly once', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = [{ id: 50, stamp: `${S}.100000`, values: { name: 'emitted before' } }];
    routeTable({ model: 'res.partner', dateField: 'create_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted: [{ id: 50, date: S }] });
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
    rows.push({ id: 49, stamp: '2026-09-29 09:58:30.500000', values: { name: 'late commit' } });
    const late = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(late.map((r) => r['id'])).toEqual([49]);
    expect(readStoredCursor(store).date).toBe(S);
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('emits a same-second update to a LOWER id exactly once', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = [
      { id: 3, stamp: '2026-09-29 09:00:00.000000', values: { name: 'old' } },
      { id: 50, stamp: `${S}.100000`, values: { name: 'emitted before' } },
    ];
    routeTable({ model: 'res.partner', dateField: 'write_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted: [{ id: 50, date: S }] });
    rows[0].stamp = `${S}.800000`;
    const first = asRecords(await newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(first.map((r) => r['id'])).toEqual([3]);
    expect(readStoredCursor(store).emitted).toEqual([{ id: 3, date: S }, { id: 50, date: S }]);
    await expect(newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('emits a record again for a later change, and once per change', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = [{ id: 7, stamp: `${S}.100000`, values: {} }];
    routeTable({ model: 'res.partner', dateField: 'write_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted: [{ id: 7, date: S }] });
    rows[0].stamp = '2026-09-29 10:02:00.000000';
    const out = asRecords(await newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(out.map((r) => r['id'])).toEqual([7]);
    expect(readStoredCursor(store)).toEqual({ date: '2026-09-29 10:02:00', floor: null, emitted: [{ id: 7, date: '2026-09-29 10:02:00' }] });
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
    const start = { date: '2026-09-29 09:00:00', floor: null, emitted: [] };
    const first = await odooPolling.pollAfter({ client, source, cursor: start, pageSize: 2 });
    expect(first.records.map((r) => r['id'])).toEqual([1, 30, 20]);
    expect(first.cursor).toEqual({ date: S, floor: null, emitted: [{ id: 1, date: '2026-09-29 09:59:59' }, { id: 20, date: S }, { id: 30, date: S }] });
    const again = await odooPolling.pollAfter({ client, source, cursor: first.cursor, pageSize: 2 });
    expect(again.records).toEqual([]);
    expect(again.cursor).toEqual(first.cursor);
  });

  it('emits a 120-record burst in one second once, across pages, and re-polls to 0', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = Array.from({ length: 120 }, (_, i) => ({ id: 1000 - i, stamp: `${S}.${String(i).padStart(6, '0')}`, values: { name: `bulk ${i}` } }));
    routeTable({ model: 'res.partner', dateField: 'create_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-29 09:00:00', floor: null, emitted: [] });
    const first = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(first).toHaveLength(120);
    expect(new Set(first.map((r) => r['id']))).toEqual(new Set(rows.map((r) => r.id)));
    expect(callsTo({ model: 'res.partner', method: 'search_read' })).toHaveLength(2);
    const cursor = readStoredCursor(store);
    expect(cursor.date).toBe(S);
    expect(cursor.emitted).toHaveLength(120);
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
    await store.put(odooPolling.CURSOR_KEY, { date: '1970-01-01 00:00:00', floor: null, emitted: [] });
    const first = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(first).toHaveLength(500);
    const second = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    const ids = [...first, ...second].map((r) => r['id']);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(rows.map((r) => r.id)));
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('caps the window memory at 5,000 entries, dropping the oldest, and still does not re-emit', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const old = '2026-09-29 09:59:00';
    const rows = [
      { id: 1, stamp: `${old}.000000`, values: {} },
      ...Array.from({ length: odooPolling.MAX_WINDOW_ENTRIES - 1 }, (_, i) => ({ id: i + 2, stamp: `${S}.000000`, values: {} })),
      { id: 9001, stamp: '2026-09-29 10:00:05.000000', values: {} },
    ];
    routeTable({ model: 'res.partner', dateField: 'create_date', rows });
    const store = memoryStore();
    const emitted = rows.slice(0, odooPolling.MAX_WINDOW_ENTRIES).map((row) => ({ id: row.id, date: row.stamp.slice(0, 19) }));
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted });
    const out = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(out.map((r) => r['id'])).toEqual([9001]);
    const cursor = readStoredCursor(store);
    expect(cursor.emitted).toHaveLength(odooPolling.MAX_WINDOW_ENTRIES);
    expect(cursor.emitted[0]).toEqual({ id: 2, date: S });
    expect(cursor.floor).toEqual({ date: old, id: 1 });
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
  });

  it('emits 6,000 rows of one second exactly once over successive polls when the memory cap drops entries', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = Array.from({ length: 6000 }, (_, i) => ({ id: i + 1, stamp: `${S}.${String(i).padStart(6, '0')}`, values: {} }));
    routeTable({ model: 'res.partner', dateField: 'create_date', rows });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-29 09:00:00', floor: null, emitted: [] });
    const seen: unknown[] = [];
    for (let poll = 0; poll < 20; poll++) {
      const out = asRecords(await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
      if (out.length === 0) break;
      seen.push(...out.map((r) => r['id']));
    }
    expect(seen).toHaveLength(6000);
    expect(new Set(seen).size).toBe(6000);
    const cursor = readStoredCursor(store);
    expect(cursor.emitted).toHaveLength(odooPolling.MAX_WINDOW_ENTRIES);
    expect(cursor.floor).toEqual({ date: S, id: 1000 });
    const last = callsTo({ model: 'res.partner', method: 'search_read' }).pop();
    expect(JSON.stringify(last?.args[0])).toContain(`"|",["create_date",">=","2026-09-29 10:00:01"],"&",["create_date",">=","${S}"],["id",">",1000]`);
  });

  it('prunes window memory older than 5 minutes before the cursor', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [{ id: 8, stamp: '2026-09-29 10:10:00.000000', values: {} }] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: S, emitted: [{ id: 5, date: '2026-09-29 09:58:00' }, { id: 6, date: S }] });
    await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }));
    const [call] = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(JSON.stringify(call.args[0])).toContain(`["create_date",">=","${S}"]`);
    expect(readStoredCursor(store)).toEqual({ date: '2026-09-29 10:10:00', floor: null, emitted: [{ id: 8, date: '2026-09-29 10:10:00' }] });
  });

  it('does not rewrite the cursor when nothing is new', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    route({ key: 'res.partner.search_read', handler: () => [] });
    const store = memoryStore();
    const cursor = { date: S, floor: null, emitted: [{ id: 5, date: S }] };
    await store.put(odooPolling.CURSOR_KEY, cursor);
    await expect(newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.CURSOR_KEY)).toBe(cursor);
    expect(JSON.stringify(callsTo({ model: 'res.partner', method: 'search_read' })[0].args)).toContain('write_date');
  });

  it('first run without a cursor, or with an old-format cursor, only stores one and emits nothing', async () => {
    routeTable({ model: 'res.partner', dateField: 'create_date', rows: [{ id: 3, stamp: '2026-09-29 09:00:00.250000', values: {} }] });
    const seeded = { date: '2026-09-29 09:00:00', floor: { date: '2026-09-29 09:00:00', id: 0 }, emitted: [{ id: 3, date: '2026-09-29 09:00:00' }] };
    const store = memoryStore();
    await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual(seeded);
    for (const legacy of [{ date: '2026-09-29 09:00:00', id: 3 }, { date: '2026-09-29 09:00:00', idsAtDate: [3] }]) {
      await store.put(odooPolling.CURSOR_KEY, legacy);
      await expect(newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store }))).resolves.toEqual([]);
      expect(store.data.get(odooPolling.CURSOR_KEY)).toEqual(seeded);
    }
  });

  it('includes archived records unless the domain mentions active', async () => {
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    const rows = [{ id: 4, stamp: '2026-09-29 09:00:00.000000', values: { active: true } }];
    routeTable({ model: 'res.partner', dateField: 'write_date', rows });
    const store = memoryStore();
    await newOrUpdatedRecordTrigger.onEnable(triggerCtx({ propsValue: { model: 'res.partner' }, store }));
    rows[0] = { id: 4, stamp: `${S}.100000`, values: { active: false } };
    const out = asRecords(await newOrUpdatedRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner' }, store })));
    expect(out).toMatchObject([{ id: 4, active: false }]);
    expect(kwCalls().filter((call) => call.method !== 'fields_get').every((call) => JSON.stringify(call.kwargs['context']) === '{"active_test":false}')).toBe(true);
    resetFake();
    route({ key: 'res.partner.search_read', handler: () => [] });
    route({ key: 'res.partner.fields_get', handler: () => partnerFields });
    await newRecordTrigger.run(triggerCtx({ propsValue: { model: 'res.partner', domain: [['active', '=', true]] }, store: memoryStore() }));
    await newRecordTrigger.test(triggerCtx({ propsValue: { model: 'res.partner' }, store: memoryStore() }));
    const [scoped, all] = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(scoped.kwargs['context']).toBeUndefined();
    expect(all.kwargs['context']).toEqual({ active_test: false });
  });

  it('confirmed-order mode polls write_date on orders dated after enabling; quotation mode polls create_date with no state filter', async () => {
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    route({ key: 'sale.order.search_read', handler: () => [] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted: [] });
    await store.put(odooPolling.ENABLED_AT_KEY, '2026-09-29 09:30:00');
    await newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store }));
    await newSalesOrderTrigger.run(triggerCtx({ propsValue: { order_state: 'draft' }, store }));
    const [confirmed, quotation] = callsTo({ model: 'sale.order', method: 'search_read' }).map((call) => call.args[0]);
    expect(confirmed).toEqual(['&', '&', ['state', 'in', ['sale', 'done']], ['date_order', '>=', '2026-09-29 09:30:00'], ['write_date', '>=', LOOK]]);
    expect(quotation).toEqual([['create_date', '>=', LOOK]]);
  });

  it('confirmed mode: an old confirmed order edited later never fires; a backdated quotation confirmed after enabling fires once', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-29T09:30:00Z'));
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    const rows = [
      { id: 5, stamp: '2026-09-20 08:00:00.000000', values: { name: 'S00005', state: 'sale', date_order: '2026-09-20 08:00:00' } },
      { id: 8, stamp: '2026-09-28 12:00:00.000000', values: { name: 'S00008', state: 'draft', date_order: '2026-09-01 09:00:00' } },
    ];
    routeTable({ model: 'sale.order', dateField: 'write_date', rows });
    const store = memoryStore();
    await newSalesOrderTrigger.onEnable(triggerCtx({ propsValue: {}, store }));
    expect(store.data.get(odooPolling.ENABLED_AT_KEY)).toBe('2026-09-29 09:30:00');
    rows[0].stamp = `${S}.100000`;
    rows[1] = { ...rows[1], stamp: `${S}.300000`, values: { ...rows[1].values, state: 'sale', date_order: S } };
    const first = asRecords(await newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store })));
    expect(first.map((r) => r['id'])).toEqual([8]);
    expect(first[0]).toMatchObject({ state: 'sale', date_order: S });
    rows[1].stamp = '2026-09-29 11:00:00.000000';
    rows[0].stamp = '2026-09-29 11:00:05.000000';
    await expect(newSalesOrderTrigger.run(triggerCtx({ propsValue: {}, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.EMITTED_KEY)).toEqual([8]);
    await newSalesOrderTrigger.onEnable(triggerCtx({ propsValue: {}, store, isRepublish: true }));
    expect(store.data.get(odooPolling.ENABLED_AT_KEY)).toBe('2026-09-29 09:30:00');
    await newSalesOrderTrigger.onDisable(triggerCtx({ propsValue: {}, store }));
    expect(store.data.size).toBe(0);
  });

  it('keeps only the last 2,000 fired order ids', async () => {
    route({ key: 'sale.order.fields_get', handler: () => orderFields });
    routeTable({ model: 'sale.order', dateField: 'write_date', rows: [{ id: 9001, stamp: `${S}.1`, values: { state: 'sale', date_order: S } }] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-29 09:00:00', floor: null, emitted: [] });
    await store.put(odooPolling.ENABLED_AT_KEY, '2026-09-29 09:00:00');
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
    await store.put(odooPolling.CURSOR_KEY, { date: '2026-09-28 10:00:00', floor: null, emitted: [{ id: 2, date: '2026-09-28 10:00:00' }] });
    const out = asRecords(await newSalesOrderTrigger.run(triggerCtx({ propsValue: { order_state: 'draft' }, store })));
    expect(out.map((r) => [r['id'], r['state']])).toEqual([[3, 'sent'], [4, 'sale']]);
    await expect(newSalesOrderTrigger.run(triggerCtx({ propsValue: { order_state: 'draft' }, store }))).resolves.toEqual([]);
  });

  it('opportunities mode fires once for a lead converted after enabling and for a new opportunity, not for edits of older ones', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-29T09:30:00Z'));
    route({ key: 'crm.lead.fields_get', handler: () => leadFields });
    const rows = [
      { id: 1, stamp: '2026-09-01 08:00:00.000000', values: { type: 'opportunity', create_date: '2026-09-01 08:00:00', date_conversion: false } },
      { id: 2, stamp: '2026-09-29 09:40:00.000000', values: { type: 'lead', create_date: '2026-09-29 09:40:00', date_conversion: false } },
    ];
    routeTable({ model: 'crm.lead', dateField: 'write_date', rows });
    const store = memoryStore();
    await newLeadTrigger.onEnable(triggerCtx({ propsValue: { lead_type: 'opportunity' }, store }));
    rows[0].stamp = `${S}.100000`;
    rows[1] = { ...rows[1], stamp: `${S}.400000`, values: { ...rows[1].values, type: 'opportunity', date_conversion: S } };
    rows.push({ id: 3, stamp: `${S}.600000`, values: { type: 'opportunity', create_date: S, date_conversion: false } });
    const first = asRecords(await newLeadTrigger.run(triggerCtx({ propsValue: { lead_type: 'opportunity' }, store })));
    expect(first.map((r) => [r['id'], r['type']])).toEqual([[2, 'opportunity'], [3, 'opportunity']]);
    rows[1].stamp = '2026-09-29 10:03:00.000000';
    await expect(newLeadTrigger.run(triggerCtx({ propsValue: { lead_type: 'opportunity' }, store }))).resolves.toEqual([]);
    const polls = callsTo({ model: 'crm.lead', method: 'search_read' }).map((call) => call.args[0]);
    expect(polls[polls.length - 1]).toEqual(expect.arrayContaining([['type', '=', 'opportunity'], ['create_date', '>=', '2026-09-29 09:30:00'], ['date_conversion', '>=', '2026-09-29 09:30:00']]));
  });

  it('opportunities mode fires for a lead created before enabling and converted after, and for one moved into the team later', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-29T09:30:00Z'));
    route({ key: 'crm.lead.fields_get', handler: () => leadFields });
    const rows = [
      { id: 4, stamp: '2026-09-10 08:00:00.000000', values: { type: 'lead', team_id: 2, create_date: '2026-09-10 08:00:00', date_conversion: false } },
      { id: 5, stamp: '2026-09-29 09:31:00.000000', values: { type: 'opportunity', team_id: 1, create_date: '2026-09-29 09:31:00', date_conversion: false } },
    ];
    routeTable({ model: 'crm.lead', dateField: 'write_date', rows });
    const store = memoryStore();
    const propsValue = { lead_type: 'opportunity', team_id: 2 };
    await newLeadTrigger.onEnable(triggerCtx({ propsValue, store }));
    rows[0] = { ...rows[0], stamp: `${S}.200000`, values: { ...rows[0].values, type: 'opportunity', date_conversion: S } };
    const converted = asRecords(await newLeadTrigger.run(triggerCtx({ propsValue, store })));
    expect(converted.map((r) => r['id'])).toEqual([4]);
    rows[1] = { ...rows[1], stamp: '2026-09-29 10:01:00.000000', values: { ...rows[1].values, team_id: 2 } };
    const moved = asRecords(await newLeadTrigger.run(triggerCtx({ propsValue, store })));
    expect(moved.map((r) => r['id'])).toEqual([5]);
    rows[0].stamp = '2026-09-29 10:02:00.000000';
    await expect(newLeadTrigger.run(triggerCtx({ propsValue, store }))).resolves.toEqual([]);
    expect(store.data.get(odooPolling.EMITTED_KEY)).toEqual([4, 5]);
  });

  it('leads mode polls create_date and checks type and team when the record is created', async () => {
    route({ key: 'crm.lead.fields_get', handler: () => leadFields });
    route({ key: 'crm.lead.search_read', handler: () => [] });
    const store = memoryStore();
    await store.put(odooPolling.CURSOR_KEY, { date: S, floor: null, emitted: [] });
    await newLeadTrigger.run(triggerCtx({ propsValue: { lead_type: 'lead', team_id: 2 }, store }));
    expect(callsTo({ model: 'crm.lead', method: 'search_read' })[0].args[0]).toEqual(['&', '&', ['type', '=', 'lead'], ['team_id', '=', 2], ['create_date', '>=', LOOK]]);
    expect(store.data.has(odooPolling.EMITTED_KEY)).toBe(false);
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

  it('a failed read-back after a create still succeeds with the id and read_back_error, and never retries the create', async () => {
    routeProducts([{ id: 31, default_code: 'FURN_7800' }]);
    route({ key: 'sale.order.create', handler: () => 12 });
    route({ key: 'crm.lead.create', handler: () => 17 });
    route({ key: 'ir.attachment.create', handler: () => 90 });
    route({ key: '*.fields_get', handler: () => fault('AccessError: no read access') });
    const order = asRecord(await createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: [{ product: 'FURN_7800' }] } })));
    expect(order).toMatchObject({ id: 12, name: null, partner_id: null, partner_id_name: null, amount_total: null });
    expect(order['read_back_error']).toMatch(/^Odoo sale\.order\.fields_get failed: .*AccessError: no read access$/);
    expect(Object.keys(order)).toEqual([...createdSaleOrderOutputSchema.fields.map((field) => field.key)]);
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    const lead = await odooOperations.createLead({ client, values: { name: 'Chairs' } });
    expect(lead).toMatchObject({ id: 17, name: null, stage_id_name: null, read_back_error: expect.stringMatching(/AccessError/) });
    route({ key: '*.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'ir.attachment.read', handler: () => [] });
    await expect(odooOperations.attachFile({ client, model: 'sale.order', recordId: 12, file: { data: Buffer.from('PDF'), filename: 'a.pdf' } })).resolves.toMatchObject({
      id: 90,
      name: null,
      read_back_error: 'ir.attachment record 90 was not found',
    });
    expect(callsTo({ model: 'sale.order', method: 'create' })).toHaveLength(1);
    expect(callsTo({ model: 'crm.lead', method: 'create' })).toHaveLength(1);
    expect(createdLeadOutputSchema.fields.map((field) => field.key)).toContain('read_back_error');
    expect(createdAttachmentOutputSchema.fields.map((field) => field.key)).toContain('read_back_error');
  });

  it('resolveProducts: numbers are IDs, strings are internal references first, then IDs, in two batched calls', async () => {
    routeProducts([
      { id: 31, default_code: 'FURN_7800' },
      { id: 44, default_code: false },
      { id: 50, default_code: '777' },
      { id: 60, default_code: '44' },
      { id: 70, default_code: '70' },
    ]);
    const client = OdooClient.fromAuth({ auth: AUTH_PROPS });
    const resolve = (values: unknown[]) => odooOperations.resolveProducts({ client, refs: values.map((value) => ({ value, label: 'Product' })) });
    await expect(resolve([44])).resolves.toEqual([44]);
    expect(kwCalls()).toHaveLength(0);
    await expect(resolve(['FURN_7800', '777', '31', '70', 44, 'FURN_7800'])).resolves.toEqual([31, 50, 31, 70, 44, 31]);
    const calls = callsTo({ model: 'product.product', method: 'search_read' });
    expect(calls.map((call) => firstArgList(call))).toEqual([[['default_code', 'in', ['FURN_7800', '777', '31', '70']]], [['id', 'in', [777, 31, 70]]]]);
    await expect(resolve(['44'])).rejects.toThrow(
      'Product: "44" is the internal reference of product 60 and also the ID of product 44. Pass the ID as a number, or use the internal reference of the product you mean.',
    );
    await expect(resolve(['999'])).rejects.toThrow('Product: no product with ID or internal reference "999".');
    await expect(resolve(['NOPE'])).rejects.toThrow('Product: no product with ID or internal reference "NOPE".');
    await expect(resolve([' '])).rejects.toThrow('Product: enter a product ID or internal reference.');
    await expect(resolve([4.5])).rejects.toThrow(/positive whole number/);
    resetFake();
    routeProducts([{ id: 31, default_code: 'FURN_7800' }]);
    await expect(resolve(['FURN_7800'])).resolves.toEqual([31]);
    expect(callsTo({ model: 'product.product', method: 'search_read' })).toHaveLength(1);
  });

  it('create_sales_order resolves all line products in one batch and refuses more than 200 lines', async () => {
    routeProducts([{ id: 31, default_code: 'FURN_7800' }, { id: 32, default_code: 'FURN_7801' }]);
    route({ key: 'sale.order.create', handler: () => 12 });
    route({ key: 'sale.order.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'sale.order.read', handler: () => [{ id: 12, name: 'S00012' }] });
    const lines = Array.from({ length: odooOperations.MAX_LINES }, (_, i) => ({ product: i % 2 === 0 ? 'FURN_7800' : 'FURN_7801' }));
    await createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines } }));
    expect(callsTo({ model: 'product.product', method: 'search_read' })).toHaveLength(1);
    const [create] = callsTo({ model: 'sale.order', method: 'create' });
    expect(JSON.stringify(create.args)).toContain('[0,0,{"product_id":32,"product_uom_qty":1}]');
    resetFake();
    await expect(createSalesOrderAction.run(actionCtx({ propsValue: { partner_id: 7, lines: [...lines, { product: 'FURN_7800' }] } }))).rejects.toThrow(
      'Add at most 200 order lines per call (got 201). Split the rest into another call.',
    );
    expect(kwCalls()).toHaveLength(0);
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
    await expect(odooOperations.resolveProducts({ client, refs: [{ value: 'DUP', label: 'Product' }] })).rejects.toThrow(
      'Product: more than one product has the internal reference "DUP". Use the product ID.',
    );
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
    key: 'product.product.search_read',
    handler: (call) => products.filter((record) => evalDomain({ record, domain: firstArgList(call) })),
  });
}

function readStoredCursor(store: ReturnType<typeof memoryStore>): { date: unknown; floor: unknown; emitted: unknown[] } {
  const record = asRecord(store.data.get(odooPolling.CURSOR_KEY));
  const emitted = record['emitted'];
  return { date: record['date'], floor: record['floor'], emitted: Array.isArray(emitted) ? emitted : [] };
}

function actionCtx({ propsValue, extra = {} }: ActionCtxParams) {
  return { ...createMockActionContext({ propsValue }), auth: auth(extra) };
}

function triggerCtx({ propsValue, store, isRepublish }: TriggerCtxParams) {
  return { ...createMockPollingTriggerContext({ propsValue }), auth: auth(), store, isRepublish };
}

type ActionCtxParams = { propsValue: Record<string, unknown>; extra?: Record<string, unknown> };

type TriggerCtxParams = { propsValue: Record<string, unknown>; store: ReturnType<typeof memoryStore>; isRepublish?: boolean };
