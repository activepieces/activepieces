import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { lsRequest, numericId, seg, readPath } from '../common/client';
import { countryCode } from '../common/validation';


export const generateOrderInvoice = createAction({
  auth: lemonSqueezyAuth,
  name: 'generate_order_invoice',
  displayName: 'Generate Order Invoice',
  description: 'Generate a downloadable PDF invoice for an order.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Generates a PDF invoice for a paid Lemon Squeezy order with the billing name and address you give, and returns a temporary download URL. Calling it again regenerates the same invoice with the latest details. Send the URL to the customer; it expires.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'order_id', label: 'Order ID' },
      { key: 'invoice_url', label: 'Invoice Download URL', format: 'url', description: 'Signed, temporary link to the PDF.' },
    ],
  },
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The numeric ID of the order.',
      required: true,
    }),
    name: Property.ShortText({ displayName: 'Billing Name', description: 'Name or company on the invoice.', required: true }),
    address: Property.ShortText({ displayName: 'Address', required: true }),
    city: Property.ShortText({ displayName: 'City', required: true }),
    state: Property.ShortText({ displayName: 'State / Region', required: false }),
    zipCode: Property.ShortText({ displayName: 'ZIP / Postal Code', required: true }),
    country: Property.ShortText({ displayName: 'Country', description: 'ISO 3166-1 alpha-2 country code, for example US.', required: true }),
    notes: Property.LongText({ displayName: 'Notes', description: 'Extra text printed on the invoice, such as a VAT number.', required: false }),
    locale: Property.ShortText({ displayName: 'Language', description: 'Invoice language code, for example en, de or fr. Defaults to English.', required: false }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const id = numericId({ value: propsValue.orderId, label: 'Order ID' });
    const { body } = await lsRequest({
      apiKey: auth.secret_text,
      method: 'POST',
      path: `/orders/${seg({ value: id, label: 'Order ID' })}/generate-invoice`,
      query: {
        name: propsValue.name,
        address: propsValue.address,
        city: propsValue.city,
        state: propsValue.state,
        zip_code: propsValue.zipCode,
        country: countryCode(propsValue.country),
        notes: propsValue.notes,
        locale: propsValue.locale,
      },
    });
    const url = readPath({ value: body, path: ['meta', 'urls', 'download_invoice'] });
    if (typeof url !== 'string' || !url) throw new Error('Lemon Squeezy did not return an invoice URL for this order.');
    return { order_id: id, invoice_url: url };
  },
});
