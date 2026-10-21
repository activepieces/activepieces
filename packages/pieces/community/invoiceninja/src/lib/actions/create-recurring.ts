import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaLegacy } from '../common/legacy-invoice';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';

const LEGACY_PROPS = invoiceNinjaLegacy.legacyProps();

export const createRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'create_recurring_invoice',
  classification: 'WRITE',
  displayName: 'Create Recurring Invoice',
  description: 'Creates a recurring invoice from existing products on a billing schedule.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.legacyRecurringCreated,
  props: {
    client_id: LEGACY_PROPS.client_id,
    purchase_order_no: LEGACY_PROPS.purchase_order_no,
    discount: LEGACY_PROPS.discount,
    discount_type: LEGACY_PROPS.discount_type,
    public_notes: LEGACY_PROPS.public_notes,
    private_notes: LEGACY_PROPS.private_notes,
    order_items_json: LEGACY_PROPS.order_items_json,
    frequency: Property.StaticDropdown({
      displayName: 'Frequency of billing',
      description: 'How often an invoice is generated.',
      defaultValue: 5,
      required: true,
      options: {
        options: [
          { label: 'Use override below', value: 0 },
          { label: 'Daily', value: 1 },
          { label: 'Weekly', value: 2 },
          { label: '2 Weeks', value: 3 },
          { label: '4 Weeks', value: 4 },
          { label: 'Monthly', value: 5 },
          { label: 'Two Months', value: 6 },
          { label: 'Quarterly', value: 7 },
          { label: 'Four Months', value: 8 },
          { label: 'Semi Annually', value: 9 },
          { label: 'Annually', value: 10 },
          { label: 'Two Years', value: 11 },
          { label: 'Three Years', value: 12 },
        ],
      },
    }),
    nocycles: Property.Number({
      displayName: 'Number of billing cycles',
      description: 'How many invoices to generate. Empty = endless.',
      required: false,
    }),
    auto_frequency: Property.Number({
      displayName: 'Override Frequency ID',
      description: 'When set, this wins over Frequency: 1-12 (Daily 1, Weekly 2, ...).',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Next send date',
      description: 'Date the first invoice is generated, e.g. 2024-01-20.',
      required: true,
    }),
    last_date: Property.DateTime({
      displayName: 'Last sent date',
      description: 'Optional, e.g. 2024-01-20.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const clientId = invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client' });
    const nextSendDate = invoiceNinjaClient.toDateOnly({ value: propsValue.due_date, label: 'Next send date' });
    if (nextSendDate === undefined) throw new Error('Next send date is required.');
    const lastSentDate = invoiceNinjaClient.toDateOnly({ value: propsValue.last_date, label: 'Last sent date' });
    const cycles = invoiceNinjaClient.optionalInt({ value: propsValue.nocycles, label: 'Number of billing cycles', min: 0, max: 999 });
    const override = invoiceNinjaClient.optionalInt({ value: propsValue.auto_frequency, label: 'Override Frequency ID', min: 1, max: 12 });
    const frequency = override ?? propsValue.frequency;
    if (frequency === undefined || frequency < 1 || frequency > 12) {
      throw new Error('Choose a billing frequency, or enter an Override Frequency ID (1-12) with "Use override below".');
    }
    const discount = invoiceNinjaClient.optionalNumber({ value: propsValue.discount, label: 'Invoice Discount', min: 0 }) ?? 0;
    const isAmountDiscount = propsValue.discount_type !== false;
    const lineItems = await invoiceNinjaLegacy.lineItemsFromProducts({ auth: auth.props, json: propsValue.order_items_json, isAmountDiscount });
    const body = invoiceNinjaClient.compact({
      client_id: clientId,
      next_send_date: nextSendDate,
      last_sent_date: lastSentDate,
      po_number: invoiceNinjaClient.optionalText(propsValue.purchase_order_no),
      public_notes: invoiceNinjaClient.optionalText(propsValue.public_notes),
      private_notes: invoiceNinjaClient.optionalText(propsValue.private_notes),
      line_items: lineItems,
      discount,
      is_amount_discount: isAmountDiscount,
      frequency_id: String(frequency),
      remaining_cycles: cycles ?? -1,
    });
    return invoiceNinjaClient.envelopeOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/recurring_invoices', body }),
    );
  },
});
