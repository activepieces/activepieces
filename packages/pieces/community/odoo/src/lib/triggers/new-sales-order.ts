import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { odooApps } from '../common/app-fields';
import { OdooClient } from '../common/client';
import { odooPolling, PollSource } from '../common/polling';
import { Domain, odooDomain } from '../common/values';
import { saleOrderOutputSchema } from '../output-schemas';

function sourceOf({ propsValue, enabledAt }: { propsValue: { order_state?: string }; enabledAt?: string }): PollSource {
  const quotations = propsValue.order_state === 'draft';
  const since: Domain = enabledAt ? [['date_order', '>=', enabledAt]] : [];
  const confirmed = odooDomain.andDomains([[['state', 'in', ['sale', 'done']]], since]);
  return {
    model: odooApps.saleOrder.model,
    dateField: quotations ? 'create_date' : 'write_date',
    domain: quotations ? [] : confirmed,
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
      'Fires once per Odoo sales order (sale.order). Default mode: once when an order is confirmed after the trigger was turned on (the enable time is taken from the Activepieces server clock). Confirming with the Confirm button or action_confirm sets the order date to the confirmation time, so a quotation with an old order date still fires. An order set to confirmed by a direct state write or an import keeps its old order date and does not fire. Orders confirmed before the trigger was turned on never fire, even when edited later. Later edits of a fired order do not fire again (it remembers the last 2,000 fired orders). Other mode: once per new quotation by creation date, even if it was already sent or confirmed before the poll. Each poll looks back 5 minutes, so orders saved up to 5 minutes late are still caught. Needs the Sales app. Delivery is exactly once for up to 5,000 separate ID ranges changed within 5 minutes; beyond that, a later change to a lower-ID record in an already-dropped second can be missed.',
  },
  type: TriggerStrategy.POLLING,
  props: {
    order_state: Property.StaticDropdown({
      displayName: 'Fire On',
      description:
        'Orders confirmed after the trigger was turned on, or new quotations. Only orders confirmed with the Confirm button (action_confirm) fire; orders set to confirmed by a direct state write or an import keep their old order date and do not fire.',
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
    const enabledAt = await odooPolling.enabledAt({ store: context.store, reset: !context.isRepublish });
    await odooPolling.onEnable({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf({ propsValue: context.propsValue, enabledAt }),
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  async onDisable(context) {
    await odooPolling.onDisable({ store: context.store });
  },
  async run(context) {
    const enabledAt = await odooPolling.enabledAt({ store: context.store });
    return odooPolling.run({
      client: OdooClient.fromAuth({ auth: context.auth.props }),
      source: sourceOf({ propsValue: context.propsValue, enabledAt }),
      store: context.store,
    });
  },
  async test(context) {
    return odooPolling.test({ client: OdooClient.fromAuth({ auth: context.auth.props }), source: sourceOf({ propsValue: context.propsValue }) });
  },
});
