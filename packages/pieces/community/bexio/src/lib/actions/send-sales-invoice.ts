import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const sendSalesInvoiceAction = createAction({
  auth: bexioAuth,
  name: 'send_sales_invoice',
  displayName: 'Send Sales Invoice',
  description: 'Send a sales invoice to an email address',
  props: {
    invoice_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Invoice',
      description: 'Select the invoice to send',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const invoices = await client.get<Array<{
            id: number;
            document_nr: string;
            title?: string | null;
            contact_id?: number | null;
            total?: string;
            kb_item_status_id?: number;
          }>>('/2.0/kb_invoice');

          return {
            disabled: false,
            options: invoices.map((invoice) => {
              const label = invoice.title
                ? `${invoice.document_nr} - ${invoice.title}`
                : invoice.document_nr;
              return {
                label,
                value: invoice.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load invoices',
            options: [],
          };
        }
      },
    }),
    recipient_email: Property.ShortText({
      displayName: 'Recipient Email',
      description: 'Email address to send the invoice to',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Email message body. Must include "[Network Link]" placeholder',
      required: true,
    }),
    mark_as_open: Property.Checkbox({
      displayName: 'Mark as Open',
      description: 'Mark the invoice as open',
      required: false,
      defaultValue: false,
    }),
    attach_pdf: Property.Checkbox({
      displayName: 'Attach PDF',
      description: 'Attach PDF directly to the email',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const invoiceId = propsValue['invoice_id'] as number;
    const recipientEmail = propsValue['recipient_email'] as string;
    const subject = propsValue['subject'] as string;
    const message = propsValue['message'] as string;
    const markAsOpen = propsValue['mark_as_open'] as boolean | undefined;
    const attachPdf = propsValue['attach_pdf'] as boolean | undefined;

    const requestBody: Record<string, unknown> = {
      recipient_email: recipientEmail,
      subject,
      message,
    };

    if (markAsOpen !== undefined) {
      requestBody['mark_as_open'] = markAsOpen;
    }

    if (attachPdf !== undefined) {
      requestBody['attach_pdf'] = attachPdf;
    }

    const response = await client.post<{
      success: boolean;
    }>(`/2.0/kb_invoice/${invoiceId}/send`, requestBody);

    return response;
  },
});

