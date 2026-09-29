import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { odooApps } from '../common/app-fields';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { saleOrderOutputSchema } from '../output-schemas';

function sourceOf(propsValue: { order_state?: string }): PollSource {
  const quotations = propsValue.order_state === 'draft';
  return {
    model: odooApps.saleOrder.model,
    dateField: quotations ? 'create_date' : 'write_date',
    domain: quotations ? [] : [['state', 'in', ['sale', 'done']]],
    knownFields: odooApps.saleOrder.fields,
    manyToOne: odooApps.saleOrder.manyToOne,
    emitOnce: !quotations,
  };
}

export const newSalesOrderTrigger = createTrigger({
  auth: odooAuth,
  name: 'new_sales_order',
  displayName: 'New Sales Order',
  description: 'Triggers when a sales order is confirmed in Odoo, or when a new quotation is created.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per Odoo sales order (sale.order). Default mode: when an order reaches the confirmed state (sale or done), found by its last change, so a backdated order date is still caught and later edits of the same order do not fire again (it remembers the last 2,000 orders, so only an edit to an older order that was already confirmed before the trigger was turned on can fire once). Other mode: once per new quotation by creation date, even if it was already sent or confirmed before the poll. Needs the Sales app.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    order_state: Property.StaticDropdown({
      displayName: 'Fire On',
      description: 'Confirmed sales orders, or new quotations.',
      required: false,
      defaultValue: 'sale',
      options: {
        options: [
          { label: 'Order confirmed', value: 'sale' },
          { label: 'New quotation', value: 'draft' },
        ],
      },
    }),
  },
  outputSchema: saleOrderOutputSchema,
  sampleData: {
    id: 12,
    name: 'S00012',
    state: 'sale',
    partner_id: 42,
    partner_id_name: 'Acme Corporation',
    date_order: '2026-09-29 10:15:00',
    validity_date: '2026-10-29',
    client_order_ref: 'PO-7781',
    amount_untaxed: 1000,
    amount_tax: 150,
    amount_total: 1150,
    currency_id: 1,
    currency_id_name: 'USD',
    user_id: 2,
    user_id_name: 'Mitchell Admin',
    invoice_status: 'to invoice',
    create_date: '2026-09-28 16:02:11',
    write_date: '2026-09-29 10:15:00',
  },
  async onEnable(context) {
    await odooPolling.onEnable({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf(context.propsValue),
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await odooPolling.onDisable({ store: context.store });
  },
  async run(context) {
    return odooPolling.run({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf(context.propsValue),
      store: context.store,
    });
  },
  async test(context) {
    return odooPolling.test({ client: OdooClient.fromAuth({ auth: context.auth.props }), source: sourceOf(context.propsValue) });
  },
});
