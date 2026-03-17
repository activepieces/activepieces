import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { getQBEntity, QBInvoice } from '../common';

export const quickbooksGetInvoice = createAction({
  auth: quickbooksAuth,
  name: 'get_invoice',
  displayName: 'Get Invoice',
  description: 'Retrieves an invoice by its QuickBooks ID.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'The QuickBooks ID of the invoice to retrieve.',
      required: true,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { realm_id, invoice_id, use_sandbox } = context.propsValue;

    const invoice = await getQBEntity<QBInvoice>(
      context.auth as any,
      realm_id,
      'Invoice',
      invoice_id,
      use_sandbox ?? false
    );

    return invoice;
  },
});
