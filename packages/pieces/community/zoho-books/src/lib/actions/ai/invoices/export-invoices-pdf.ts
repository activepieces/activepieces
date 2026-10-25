import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const exportInvoicesPdfAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_export_invoices_pdf',
  displayName: 'Export Invoices PDF',
  description: 'Exports several invoices as one PDF from Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Exports up to 25 invoices into one PDF file and returns the file. Use Print Invoices for the print-ready version.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Up to 25 invoice IDs, from List Invoices.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceIds } = context.propsValue;
    const invoiceIdsList = zohoBooksUtils.toStringList({
      value: invoiceIds,
      propName: 'Invoice IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const file = await zohoBooksClient.download({
      auth: context.auth,
      path: '/invoices/pdf',
      query: { organization_id: organizationId, invoice_ids: invoiceIdsList.join(',') },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? 'invoices.pdf',
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
