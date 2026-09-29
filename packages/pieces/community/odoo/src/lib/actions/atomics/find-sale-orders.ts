import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Condition, Domain, odooDates, odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooFindSaleOrders = createAction({
  auth: odooAuth,
  name: 'odoo_find_sale_orders',
  classification: 'SEARCH',
  displayName: 'Find Sales Orders',
  description: 'Search Odoo quotations and sales orders.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Odoo quotations and sales orders (sale.order) by status, customer (including its contacts), order reference or customer reference, and order date range, newest first with offset paging. Needs the Sales app. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.saleOrders,
  props: {
    states: Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'draft = quotation, sent = quotation sent, sale = sales order, cancel = cancelled (done = locked, Odoo 16 only). Omit for all.',
      required: false,
      options: {
        options: [
          { label: 'Quotation', value: 'draft' },
          { label: 'Quotation sent', value: 'sent' },
          { label: 'Sales order', value: 'sale' },
          { label: 'Locked (Odoo 16)', value: 'done' },
          { label: 'Cancelled', value: 'cancel' },
        ],
      },
    }),
    partner_id: atomicProps.optionalIdProp({ displayName: 'Customer ID', description: 'res.partner ID; includes orders of its contacts.' }),
    reference: atomicProps.textProp({ displayName: 'Reference Contains', description: 'Matches the order number (S00012) or the customer reference.' }),
    date_from: atomicProps.textProp({ displayName: 'Order Date From', description: 'ISO date or datetime (UTC when no zone).' }),
    date_to: atomicProps.textProp({ displayName: 'Order Date To', description: 'ISO date or datetime (UTC when no zone).' }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const conditions: Condition[] = [];
    const states = odooInput.toStringList(p.states);
    if (states.length > 0) conditions.push(['state', 'in', states]);
    const partnerId = odooInput.optionalId({ value: p.partner_id, label: 'Customer ID' });
    if (partnerId) conditions.push(['partner_id', 'child_of', partnerId]);
    const from = odooDates.inputToOdooDatetime({ value: p.date_from, label: 'Order Date From' });
    const to = odooDates.inputToOdooDatetime({ value: p.date_to, label: 'Order Date To' });
    if (from) conditions.push(['date_order', '>=', from]);
    if (to) conditions.push(['date_order', '<=', to]);
    const reference = odooInput.optionalText(p.reference);
    const search: Domain = reference ? odooDomain.orConditions([['name', 'ilike', reference], ['client_order_ref', 'ilike', reference]]) : [];
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooRecords.findApp({
      client,
      model: odooApps.saleOrder.model,
      wanted: odooApps.saleOrder.fields,
      manyToOne: odooApps.saleOrder.manyToOne,
      domain: odooDomain.andDomains([conditions, search]),
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'date_order desc, id desc',
    });
  },
});
