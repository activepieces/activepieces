import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaLegacy } from '../common/legacy-invoice';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';

const LEGACY_PROPS = invoiceNinjaLegacy.legacyProps();

export const createInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates an invoice from existing products (price and tax are taken from each product).',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.legacyInvoiceCreated,
  props: {
    client_id: LEGACY_PROPS.client_id,
    purchase_order_no: LEGACY_PROPS.purchase_order_no,
    discount: LEGACY_PROPS.discount,
    discount_type: LEGACY_PROPS.discount_type,
    public_notes: LEGACY_PROPS.public_notes,
    private_notes: LEGACY_PROPS.private_notes,
    order_items_json: LEGACY_PROPS.order_items_json,
    send_email: Property.Checkbox({
      displayName: 'E-mail the invoice to the client',
      description: 'Send the invoice by Invoice Ninja e-mail when it is created.',
      defaultValue: false,
      required: true,
    }),
    mark_sent: Property.Checkbox({
      displayName: 'Mark the invoice as sent',
      description: 'Makes the invoice active; otherwise it stays a draft.',
      defaultValue: false,
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: 'Invoice due date',
      description: 'The date part is used, e.g. 2024-01-20.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const clientId = invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client' });
    const dueDate = invoiceNinjaClient.toDateOnly({ value: propsValue.due_date, label: 'Invoice due date' });
    const discount = invoiceNinjaClient.optionalNumber({ value: propsValue.discount, label: 'Invoice Discount', min: 0 }) ?? 0;
    const isAmountDiscount = propsValue.discount_type !== false;
    const lineItems = await invoiceNinjaLegacy.lineItemsFromProducts({ auth: auth.props, json: propsValue.order_items_json, isAmountDiscount });
    const body = invoiceNinjaClient.compact({
      client_id: clientId,
      due_date: dueDate,
      po_number: invoiceNinjaClient.optionalText(propsValue.purchase_order_no),
      public_notes: invoiceNinjaClient.optionalText(propsValue.public_notes),
      private_notes: invoiceNinjaClient.optionalText(propsValue.private_notes),
      line_items: lineItems,
      discount,
      is_amount_discount: isAmountDiscount,
    });
    const query = { send_email: propsValue.send_email === true ? 'true' : undefined, mark_sent: propsValue.mark_sent === true ? 'true' : undefined };
    return invoiceNinjaClient.envelopeOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/invoices', query, body }),
    );
  },
});
