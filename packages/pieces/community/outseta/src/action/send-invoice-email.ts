import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const sendInvoiceEmailAction = createAction({
  name: 'send_invoice_email',
  auth: outsetaAuth,
  displayName: 'Send Invoice Email',
  description:
    'Send (or resend) the invoice email to the customer associated with an invoice.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends (or resends) the invoice email to the customer for a given invoice UID. Use to deliver a copy of an invoice. Not idempotent: each call sends another email.',
    idempotent: false,
  },
  props: {
    invoiceUid: Property.ShortText({
      displayName: 'Invoice UID',
      description: 'The UID of the invoice whose email should be sent.',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.post<unknown>(
      `/api/v1/billing/invoices/${context.propsValue.invoiceUid}/sendinvoiceemail`,
      {}
    );

    return {
      invoice_uid: context.propsValue.invoiceUid,
      email_sent: true,
    };
  },
});
