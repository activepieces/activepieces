import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const exportInvoicePdfAction = createAction({
  auth: bexioAuth,
  name: 'export_invoice_pdf',
  displayName: 'Export Invoice to PDF',
  description: 'Export an existing sales invoice as a PDF document',
  props: {
    invoice_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Invoice',
      description: 'Select the invoice to export',
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
    logopaper: Property.StaticDropdown({
      displayName: 'Letterhead',
      description: 'Whether to include letterhead in the PDF',
      required: false,
      defaultValue: 1,
      options: {
        disabled: false,
        options: [
          { label: 'With Letterhead', value: 1 },
          { label: 'Without Letterhead', value: 0 },
        ],
      },
    }),
  },
  async run({ auth, propsValue, files }) {
    const client = new BexioClient(auth);
    const invoiceId = propsValue['invoice_id'] as number;
    const logopaper = propsValue['logopaper'] as number | undefined;

    const queryParams: Record<string, string> = {};
    if (logopaper !== undefined) {
      queryParams['logopaper'] = logopaper.toString();
    }

    const response = await client.get<{
      name: string;
      size: number;
      mime: string;
      content: string;
    }>(`/2.0/kb_invoice/${invoiceId}/pdf`, queryParams);

    const fileUrl = await files.write({
      fileName: response.name || `invoice_${invoiceId}.pdf`,
      data: Buffer.from(response.content, 'base64'),
    });

    return {
      file: fileUrl,
      fileName: response.name,
      size: response.size,
      mimeType: response.mime,
    };
  },
});

