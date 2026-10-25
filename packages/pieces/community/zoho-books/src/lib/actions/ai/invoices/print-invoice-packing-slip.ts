import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const printInvoicePackingSlipAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_print_invoice_packing_slip',
  displayName: 'Print Invoice Packing Slip',
  description: 'Exports the packing slip of a Zoho Books invoice as a PDF file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Exports the packing slip of one invoice as a PDF file and returns the file. Use Get Invoice Packing Slips for several invoices at once.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const file = await zohoBooksClient.download({
      auth: context.auth,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/packingslip/print`,
      query: { organization_id: organizationId },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? 'packing-slip.pdf',
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
