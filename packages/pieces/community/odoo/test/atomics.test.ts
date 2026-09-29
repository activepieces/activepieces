import { beforeEach, describe, expect, it } from 'vitest';
import { createMockActionContext, OutputSchema } from '@activepieces/pieces-framework';
import { asRecord, asRecords, auth, callsTo, fake, fault, fieldsOf, resetFake, route, userFault } from './fake-odoo';
import { odoo } from '../src/index';
import { odooAtomics } from '../src/lib/actions/atomics';
import { odooUpdateRecords } from '../src/lib/actions/atomics/update-records';
import { odooCreatePartner } from '../src/lib/actions/atomics/create-partner';
import { odooNameSearch } from '../src/lib/actions/atomics/name-search';
import { odooMarkLeadLost } from '../src/lib/actions/atomics/mark-lead-lost';
import { odooCreateProduct } from '../src/lib/actions/atomics/create-product';
import { odooListModels } from '../src/lib/actions/atomics/list-models';
import { odooGetConnectionInfo } from '../src/lib/actions/atomics/get-connection-info';
import { odooPostMessage } from '../src/lib/actions/atomics/post-message';
import { odooFindPartners } from '../src/lib/actions/atomics/find-partners';
import { odooListCrmStages } from '../src/lib/actions/atomics/list-crm-stages';
import { odooPostInvoice } from '../src/lib/actions/atomics/post-invoice';
import { odooSearchRecords } from '../src/lib/actions/atomics/search-records';
import { odooCreateTask } from '../src/lib/actions/atomics/create-task';
import { odooCallMethod } from '../src/lib/actions/atomics/call-method';
import { odooDeleteRecords } from '../src/lib/actions/atomics/delete-records';
import { odooCreateLead } from '../src/lib/actions/atomics/create-lead';
import { odooCreateInvoice } from '../src/lib/actions/atomics/create-invoice';

function schemaKeys(schema: OutputSchema | undefined): string[] {
  return (schema?.fields ?? []).map((f) => f.key);
}

function listKeys({ schema, key }: { schema: OutputSchema | undefined; key: string }): string[] {
  return (schema?.fields.find((f) => f.key === key)?.listItems ?? []).map((f) => f.key);
}

beforeEach(() => resetFake());

describe('registration', () => {
  const all = Object.values(odoo.actions());

  it('ships 34 ai atomics with unique names and full metadata', () => {
    expect(odooAtomics).toHaveLength(34);
    const names = all.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
    for (const a of odooAtomics) {
      expect(a.name.startsWith('odoo_')).toBe(true);
      expect(a.audience).toBe('ai');
      expect(a.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
      expect(typeof a.aiMetadata?.idempotent).toBe('boolean');
      expect(a.classification).toBeDefined();
    }
    const withoutSchema = odooAtomics.filter((a) => !a.outputSchema).map((a) => a.name);
    expect(withoutSchema).toEqual([]);
  });

  it('demotes the 7 originals and keeps the new human actions off the agent surface', () => {
    const human = all.filter((a) => a.audience === 'human').map((a) => a.name).sort();
    expect(human).toEqual(
      [
        'attach_file', 'create_company', 'create_contact', 'create_lead', 'create_record', 'create_sales_order',
        'custom_odoo_api_call', 'delete_record', 'find_invoices', 'get_contacts', 'get_record', 'get_records',
        'post_chatter_message', 'run_record_action', 'update_record',
      ].sort(),
    );
    expect(all.filter((a) => a.audience === 'both')).toHaveLength(0);
  });

  it('has 5 polling triggers classified READ', () => {
    const triggers = Object.values(odoo.triggers());
    expect(triggers.map((t) => t.name).sort()).toEqual(['new_contact', 'new_lead', 'new_or_updated_record', 'new_record', 'new_sales_order']);
    for (const t of triggers) {
      expect(t.classification).toBe('READ');
      expect(t.aiMetadata?.description).toBeTruthy();
    }
  });

  it('has a mixed idempotency split', () => {
    const t = odooAtomics.filter((a) => a.aiMetadata?.idempotent).length;
    expect(t).toBeGreaterThan(10);
    expect(odooAtomics.length - t).toBeGreaterThan(10);
  });
});

describe('partial updates', () => {
  it('update_records writes only the given keys to the given ids', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', phone: 'char' }) });
    route({ key: 'res.partner.write', handler: () => true });
    const out = await odooUpdateRecords.run(actionCtx({ propsValue: { model: 'res.partner', ids: ['7', 8, 7], values: '{"phone": "+1 555"}' } }));
    expect(callsTo({ model: 'res.partner', method: 'write' })[0].args).toEqual([[7, 8], { phone: '+1 555' }]);
    expect(out).toEqual({ success: true, model: 'res.partner', ids: [7, 8], updated_count: 2 });
  });

  it('update_records refuses empty values and empty ids before any request', async () => {
    await expect(odooUpdateRecords.run(actionCtx({ propsValue: { model: 'res.partner', ids: [1], values: {} } }))).rejects.toThrow(/at least one field/);
    await expect(odooUpdateRecords.run(actionCtx({ propsValue: { model: 'res.partner', ids: [], values: { a: 1 } } }))).rejects.toThrow(/at least one ID/);
    expect(callsTo({ model: 'res.partner', method: 'write' })).toHaveLength(0);
  });

  it('update_records refuses fields this Odoo version does not have (Odoo 19 has no mobile)', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', phone: 'char' }) });
    route({ key: 'res.partner.write', handler: () => fault("KeyError: 'mobile'") });
    await expect(odooUpdateRecords.run(actionCtx({ propsValue: { model: 'res.partner', ids: [7], values: { phone: '1', mobile: '2' } } }))).rejects.toThrow(
      'Unknown field(s) on res.partner: mobile. Use Get Model Fields to see the field names of this Odoo version.',
    );
    expect(callsTo({ model: 'res.partner', method: 'write' })).toHaveLength(0);
  });

  it('create_invoice names the line whose product cannot be resolved', async () => {
    route({ key: 'product.product.search', handler: () => [] });
    await expect(
      odooCreateInvoice.run(actionCtx({ propsValue: { partner_id: 7, lines: [{ product: 'MISSING', quantity: 1 }] } })),
    ).rejects.toThrow('Line 1 product: no product with ID or internal reference "MISSING".');
    expect(callsTo({ model: 'account.move', method: 'create' })).toHaveLength(0);
  });

  it('create_partner sends only the props that were given', async () => {
    route({ key: 'res.country.search', handler: () => [233] });
    route({ key: 'res.partner.create', handler: () => 50 });
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', email: 'char', country_id: 'many2one' }) });
    route({ key: 'res.partner.read', handler: () => [{ id: 50, name: 'Jane', email: 'j@x.com', country_id: [233, 'United States'] }] });
    const out = asRecord(await odooCreatePartner.run(actionCtx({ propsValue: { name: 'Jane', email: 'j@x.com', phone: '  ', is_company: false, country_code: 'us' } })));
    expect(callsTo({ model: 'res.partner', method: 'create' })[0].args).toEqual([{ name: 'Jane', email: 'j@x.com', country_id: 233 }]);
    expect(callsTo({ model: 'res.country', method: 'search' })[0].args).toEqual([[['code', '=', 'US']]]);
    expect(out).toMatchObject({ id: 50, country_id: 233, country_id_name: 'United States', mobile: null, parent_id_name: null });
  });

  it('create_task sends x2many as replace commands and a date-only deadline', async () => {
    route({ key: 'project.task.create', handler: () => 3 });
    route({ key: 'project.task.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'project.task.read', handler: () => [{ id: 3, name: 'T' }] });
    await odooCreateTask.run(actionCtx({ propsValue: { project_id: 1, name: 'T', user_ids: [2, '5'], date_deadline: '2026-10-15T00:00:00Z' } }));
    expect(callsTo({ model: 'project.task', method: 'create' })[0].args).toEqual([{ project_id: 1, name: 'T', user_ids: [[6, 0, [2, 5]]], date_deadline: '2026-10-15' }]);
  });

  it('create_lead validates probability before the request', async () => {
    await expect(odooCreateLead.run(actionCtx({ propsValue: { name: 'x', probability: 120 } }))).rejects.toThrow(/between 0 and 100/);
    expect(callsTo({ model: 'crm.lead', method: 'create' })).toHaveLength(0);
  });
});

describe('version-safe calls', () => {
  it('name_search is called positionally (args in 16-18, domain in 19)', async () => {
    route({ key: 'res.partner.name_search', handler: () => [[7, 'Acme']] });
    const out = await odooNameSearch.run(actionCtx({ propsValue: { model: 'res.partner', name: 'Ac', domain: [['is_company', '=', true]] } }));
    const [call] = callsTo({ model: 'res.partner', method: 'name_search' });
    expect(call.args).toEqual(['Ac', [['is_company', '=', true]], 'ilike', 10]);
    expect(call.kwargs).toEqual({});
    expect(out).toEqual({ model: 'res.partner', count: 1, results: [{ id: 7, name: 'Acme' }] });
  });

  it('mark_lead_lost tolerates the None return of action_set_lost and re-reads the lead', async () => {
    route({ key: 'crm.lead.action_set_lost', handler: () => fault('TypeError: cannot marshal None unless allow_none is enabled') });
    route({ key: 'crm.lead.fields_get', handler: () => fieldsOf({ name: 'char', active: 'boolean', lost_reason_id: 'many2one' }) });
    route({ key: 'crm.lead.read', handler: () => [{ id: 4, name: 'L', active: false, lost_reason_id: [2, 'Too expensive'] }] });
    const out = await odooMarkLeadLost.run(actionCtx({ propsValue: { lead_id: 4, lost_reason_id: 2 } }));
    expect(callsTo({ model: 'crm.lead', method: 'action_set_lost' })[0]).toMatchObject({ args: [[4]], kwargs: { lost_reason_id: 2 } });
    expect(out).toMatchObject({ id: 4, active: false, lost_reason_id: 2, lost_reason_id_name: 'Too expensive', won_status: null });
  });

  it('create_product maps kind to Odoo 18+ fields', async () => {
    route({ key: 'product.template.fields_get', handler: () => fieldsOf({ name: 'char', type: 'selection', is_storable: 'boolean' }) });
    route({ key: 'product.template.create', handler: () => 9 });
    route({ key: 'product.template.read', handler: () => [{ product_variant_id: [19, 'Chair'] }] });
    route({ key: 'product.product.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'product.product.read', handler: () => [{ id: 19, name: 'Chair' }] });
    const out = await odooCreateProduct.run(actionCtx({ propsValue: { name: 'Chair', kind: 'storable', list_price: 10 } }));
    expect(callsTo({ model: 'product.template', method: 'create' })[0].args).toEqual([{ name: 'Chair', type: 'consu', is_storable: true, list_price: 10 }]);
    expect(out).toMatchObject({ id: 19 });
  });

  it('create_product maps kind to Odoo 16/17 detailed_type and refuses storable without Inventory', async () => {
    route({ key: 'product.template.fields_get', handler: () => ({
      name: { type: 'char' },
      detailed_type: { type: 'selection', selection: [['consu', 'Consumable'], ['service', 'Service']] },
    }) });
    await expect(odooCreateProduct.run(actionCtx({ propsValue: { name: 'Chair', kind: 'storable' } }))).rejects.toThrow(/Inventory/);
    route({ key: 'product.template.create', handler: () => 9 });
    route({ key: 'product.template.read', handler: () => [{ product_variant_id: [19, 'Svc'] }] });
    route({ key: 'product.product.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'product.product.read', handler: () => [{ id: 19 }] });
    await odooCreateProduct.run(actionCtx({ propsValue: { name: 'Svc', kind: 'service' } }));
    expect(callsTo({ model: 'product.template', method: 'create' })[0].args).toEqual([{ name: 'Svc', detailed_type: 'service' }]);
  });

  it('list_models explains the Access Rights requirement', async () => {
    route({ key: 'ir.model.search_read', handler: () =>
      userFault("You are not allowed to access 'Models' (ir.model) records.\n\nThis operation is allowed for the following groups:\n\t- Administration/Access Rights\n\nContact your administrator to request access if necessary.") });
    await expect(odooListModels.run(actionCtx({ propsValue: { query: 'lead' } }))).rejects.toThrow(/odoo_get_model_fields/);
  });

  it('errors keep the whole Odoo message when there is no traceback', async () => {
    route({ key: 'res.partner.unlink', handler: () => userFault('Record does not exist or has been deleted.\n(Record: res.partner(10,), User: 2)') });
    await expect(odooDeleteRecords.run(actionCtx({ propsValue: { model: 'res.partner', ids: [10] } }))).rejects.toThrow(
      'Odoo res.partner.unlink failed: Record does not exist or has been deleted. (Record: res.partner(10,), User: 2)',
    );
  });

  it('get_connection_info probes apps and reports installed_apps only for admins', async () => {
    route({ key: 'res.users.fields_get', handler: () => fieldsOf({ name: 'char', company_id: 'many2one', tz: 'selection' }) });
    route({ key: 'res.users.read', handler: () => [{ id: 2, name: 'Bot', company_id: [1, 'Acme'], tz: false }] });
    route({ key: '*.search_count', handler: (call) => {
      if (call.model === 'crm.lead') return 0;
      if (call.model === 'stock.picking') return userFault("You are not allowed to access 'Transfer' (stock.picking) records.\n\nThis operation is allowed for the following groups:\n\t- Inventory/User\n\nContact your administrator to request access if necessary.");
      return fault(`odoo.exceptions.UserError: Object ${call.model} doesn't exist`);
    } });
    route({ key: 'res.partner.search_count', handler: () => 0 });
    route({ key: 'ir.module.module.search_read', handler: () =>
      userFault("You are not allowed to access 'Module' (ir.module.module) records.\n\nThis operation is allowed for the following groups:\n\t- Administration/Settings\n\nContact your administrator to request access if necessary.") });
    route({ key: 'res.users.has_group', handler: () => false });
    const out = asRecord(await odooGetConnectionInfo.run(actionCtx({ propsValue: {} })));
    expect(out).toMatchObject({
      server_version: '18.0',
      uid: 2,
      user_name: 'Bot',
      company_id_name: 'Acme',
      tz: null,
      has_contacts: true,
      has_crm: true,
      has_sales: false,
      has_inventory: false,
      is_admin: false,
      installed_apps: null,
    });
    expect(callsTo({ model: 'crm.lead', method: 'search_count' })[0].args).toEqual([[['id', '=', 0]]]);
    expect(callsTo({ model: 'res.users', method: 'has_group' })[0].args).toEqual([[2], 'base.group_system']);
  });

  it('get_connection_info lists apps for a non-admin who can read modules, and is_admin comes from has_group', async () => {
    route({ key: 'res.users.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'res.users.read', handler: () => [{ id: 6, name: 'Sales User' }] });
    route({ key: '*.search_count', handler: () => 0 });
    route({ key: 'ir.module.module.search_read', handler: () => [{ name: 'crm' }, { name: 'sale_management' }] });
    route({ key: 'res.users.has_group', handler: () => false });
    const out = asRecord(await odooGetConnectionInfo.run(actionCtx({ propsValue: {} })));
    expect(out).toMatchObject({ is_admin: false, installed_apps: ['crm', 'sale_management'] });
  });

  it('get_connection_info is_admin works on Odoo 16/17, where has_group is model-level', async () => {
    fake.state.version = { server_version: '17.0', server_serie: '17.0', protocol_version: 1 };
    route({ key: 'res.users.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'res.users.read', handler: () => [{ id: 2, name: 'Admin' }] });
    route({ key: '*.search_count', handler: () => 0 });
    route({ key: 'ir.module.module.search_read', handler: () => [{ name: 'crm' }] });
    route({ key: 'res.users.has_group', handler: (call) =>
      Array.isArray(call.args[0]) ? fault('TypeError: Users.has_group() takes 2 positional arguments but 3 were given') : call.args[0] === 'base.group_system' });
    const out = asRecord(await odooGetConnectionInfo.run(actionCtx({ propsValue: {} })));
    expect(out).toMatchObject({ server_serie: '17.0', is_admin: true });
    expect(callsTo({ model: 'res.users', method: 'has_group' }).map((call) => call.args)).toEqual([[[2], 'base.group_system'], ['base.group_system']]);
  });

  it('get_connection_info is_admin is true for an admin on 18/19 and null only when has_group fails otherwise', async () => {
    route({ key: 'res.users.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'res.users.read', handler: () => [{ id: 2, name: 'Admin' }] });
    route({ key: '*.search_count', handler: () => 0 });
    route({ key: 'ir.module.module.search_read', handler: () => [] });
    route({ key: 'res.users.has_group', handler: () => true });
    await expect(odooGetConnectionInfo.run(actionCtx({ propsValue: {} }))).resolves.toMatchObject({ is_admin: true });
    expect(callsTo({ model: 'res.users', method: 'has_group' })).toHaveLength(1);
    resetFake();
    route({ key: 'res.users.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    route({ key: 'res.users.read', handler: () => [{ id: 2, name: 'Admin' }] });
    route({ key: '*.search_count', handler: () => 0 });
    route({ key: 'ir.module.module.search_read', handler: () => [] });
    route({ key: 'res.users.has_group', handler: () => fault('ValueError: something else') });
    await expect(odooGetConnectionInfo.run(actionCtx({ propsValue: {} }))).resolves.toMatchObject({ is_admin: null });
    expect(callsTo({ model: 'res.users', method: 'has_group' })).toHaveLength(1);
  });

  it('post_message normalises the message id (int on 16-18, [int] on 19)', async () => {
    route({ key: 'res.partner.message_post', handler: () => [88] });
    const out = await odooPostMessage.run(actionCtx({ propsValue: { model: 'res.partner', record_id: 7, body: 'Hi' } }));
    expect(out).toEqual({ message_id: 88, model: 'res.partner', record_id: 7, message_type: 'note' });
    expect(callsTo({ model: 'res.partner', method: 'message_post' })[0]).toMatchObject({ args: [[7]], kwargs: { body: 'Hi', message_type: 'comment', subtype_xmlid: 'mail.mt_note' } });
    route({ key: 'res.partner.message_post', handler: () => 89 });
    await expect(odooPostMessage.run(actionCtx({ propsValue: { model: 'res.partner', record_id: 7, body: 'Hi', kind: 'message', partner_ids: [3] } }))).resolves.toMatchObject({ message_id: 89 });
    await expect(odooPostMessage.run(actionCtx({ propsValue: { model: 'res.partner', record_id: 7, body: 'Hi', partner_ids: [3] } }))).rejects.toThrow(/only used/);
  });

  it('find_partners leaves mobile out of the text search when the field does not exist (Odoo 19)', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', email: 'char', phone: 'char', ref: 'char', country_id: 'many2one' }) });
    route({ key: 'res.partner.search_read', handler: () => [] });
    await odooFindPartners.run(actionCtx({ propsValue: { query: 'ann', country_code: 'be' } }));
    const [call] = callsTo({ model: 'res.partner', method: 'search_read' });
    expect(call.args[0]).toEqual([
      '&',
      ['country_id.code', '=', 'BE'],
      '|', '|', '|', ['name', 'ilike', 'ann'], ['email', 'ilike', 'ann'], ['phone', 'ilike', 'ann'], ['ref', 'ilike', 'ann'],
    ]);
    expect(call.kwargs['fields']).not.toContain('mobile');
  });

  it('list_crm_stages uses team_ids on 19 and team_id before, and always returns team_ids', async () => {
    route({ key: 'crm.stage.fields_get', handler: () => fieldsOf({ name: 'char', team_id: 'many2one', is_won: 'boolean' }) });
    route({ key: 'crm.stage.search_read', handler: () => [{ id: 1, name: 'New', team_id: [3, 'Sales'], is_won: false }] });
    const out = asRecord(await odooListCrmStages.run(actionCtx({ propsValue: { team_id: 3 } })));
    const records = asRecords(out['records']);
    expect(callsTo({ model: 'crm.stage', method: 'search_read' })[0].args[0]).toEqual(['|', ['team_id', '=', false], ['team_id', 'in', [3]]]);
    expect(records[0]).toEqual({ id: 1, name: 'New', sequence: null, is_won: false, fold: null, team_ids: [3] });
  });

  it('post_invoice throws when the move is still draft (confirmation wizard)', async () => {
    route({ key: 'account.move.action_post', handler: () => ({ type: 'ir.actions.act_window' }) });
    route({ key: 'account.move.fields_get', handler: () => fieldsOf({ name: 'char', state: 'selection' }) });
    route({ key: 'account.move.read', handler: () => [{ id: 1, name: '/', state: 'draft' }] });
    await expect(odooPostInvoice.run(actionCtx({ propsValue: { invoice_id: 1 } }))).rejects.toThrow(/confirmation step/);
  });

  it('call_method passes ids first, then extra args and kwargs', async () => {
    route({ key: 'res.partner.message_subscribe', handler: () => true });
    const out = await odooCallMethod.run(actionCtx({ propsValue: { model: 'res.partner', method: 'message_subscribe', ids: [7], kwargs: { partner_ids: [3] } } }));
    expect(callsTo({ model: 'res.partner', method: 'message_subscribe' })[0]).toMatchObject({ args: [[7]], kwargs: { partner_ids: [3] } });
    expect(out).toEqual({ model: 'res.partner', method: 'message_subscribe', record_ids: [7], returned_none: false, result: true });
    expect(Object.keys(asRecord(out)).sort()).toEqual(schemaKeys(odooCallMethod.outputSchema).sort());
  });

  it('delete_records surfaces a second delete as an error', async () => {
    route({ key: 'res.partner.unlink', handler: () => fault('odoo.exceptions.MissingError: Record does not exist or has been deleted.') });
    await expect(odooDeleteRecords.run(actionCtx({ propsValue: { model: 'res.partner', ids: [7] } }))).rejects.toThrow(/MissingError/);
  });
});

describe('outputs match their schemas', () => {
  it('search_records envelope keys match and binary fields are skipped by default', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', display_name: 'char', image_1920: 'binary' }) });
    route({ key: 'res.partner.search_read', handler: () => [{ id: 1, name: 'A', display_name: 'A' }] });
    const out = asRecord(await odooSearchRecords.run(actionCtx({ propsValue: { model: 'res.partner' } })));
    expect(Object.keys(out).sort()).toEqual(schemaKeys(odooSearchRecords.outputSchema).sort());
    expect(callsTo({ model: 'res.partner', method: 'search_read' })[0].kwargs['fields']).toEqual(['id', 'name', 'display_name']);
  });

  it('find_partners items carry every schema key', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char', parent_id: 'many2one' }) });
    route({ key: 'res.partner.search_read', handler: () => [{ id: 1, name: 'A', parent_id: false }] });
    const out = asRecord(await odooFindPartners.run(actionCtx({ propsValue: {} })));
    const records = asRecords(out['records']);
    expect(Object.keys(out).sort()).toEqual(schemaKeys(odooFindPartners.outputSchema).sort());
    for (const key of listKeys({ schema: odooFindPartners.outputSchema, key: 'records' })) {
      expect(records[0]).toHaveProperty(key);
    }
  });

  it('unknown requested fields fail with a pointer to get_model_fields', async () => {
    route({ key: 'res.partner.fields_get', handler: () => fieldsOf({ name: 'char' }) });
    await expect(odooSearchRecords.run(actionCtx({ propsValue: { model: 'res.partner', fields: ['nope'] } }))).rejects.toThrow(/odoo_get_model_fields|Get Model Fields/);
  });
});

function actionCtx({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { ...createMockActionContext({ propsValue }), auth: auth() };
}
