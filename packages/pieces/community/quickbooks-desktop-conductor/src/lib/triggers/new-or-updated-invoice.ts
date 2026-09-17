import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { quickbooksDesktopConductorAuth } from '../auth';
import { ConductorAuth } from '../common/client';
import { fetchAllUpdatedSince } from '../common/polling';
import { ConductorInvoice, flattenInvoice } from '../common/invoices';
import { newOrUpdatedInvoiceTriggerOutputSchema } from '../output-schemas';

const polling: Polling<AppConnectionValueForAuthProperty<typeof quickbooksDesktopConductorAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
    const invoices = await fetchAllUpdatedSince<ConductorInvoice>({
      auth: conductorAuth,
      resourceUri: '/quickbooks-desktop/invoices',
      updatedAfterEpochMS: lastFetchEpochMS,
    });
    return invoices.map((invoice) => ({
      epochMilliSeconds: new Date(invoice.updatedAt).getTime(),
      data: flattenInvoice(invoice),
    }));
  },
};

export const newOrUpdatedInvoiceTrigger = createTrigger({
  auth: quickbooksDesktopConductorAuth,
  name: 'new_or_updated_invoice',
  displayName: 'New or Updated Invoice',
  description: 'Fires when an invoice is created or updated (e.g. line items, balance, or payment status changed) in QuickBooks Desktop. One event per invoice change, not create-only.',
  aiMetadata: {
    description: 'Fires when an invoice is created or changed in QuickBooks Desktop, emitting the current invoice record. Fires on every update to a matching invoice, not just its creation — a flow reacting only to brand-new invoices should check whether created_at and updated_at are close together. Polls every ~5 minutes; if the QuickBooks Desktop machine is off or asleep at poll time, the poll fails visibly (Conductor returns a connection error) rather than silently returning zero results.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  outputSchema: newOrUpdatedInvoiceTriggerOutputSchema,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: '2FC27-1797340210',
    transaction_date: '2026-08-20',
    due_date: '2026-08-20',
    ref_number: 'SUITE1',
    memo: 'full suite test',
    customer_id: '800000EA-1797339907',
    customer_name: 'Suite Test Customer',
    subtotal_amount: '270.00',
    sales_tax_amount: '0.00',
    total_amount: '270.00',
    // A partial payment after creation, so this sample shows the "or updated" half too, not
    // just a fresh invoice.
    balance_remaining: '120.00',
    is_paid: false,
    line_count: 1,
    revision_number: '1797340229',
    created_at: '2026-12-15T16:10:10+03:00',
    updated_at: '2026-12-15T16:10:29+03:00',
  },
});
