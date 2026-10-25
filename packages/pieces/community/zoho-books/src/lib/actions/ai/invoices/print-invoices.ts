import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const printInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_print_invoices',
  displayName: 'Print Invoices',
  description: 'Gets a print-ready PDF of several invoices from Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Builds a print-ready PDF of up to 25 invoices and returns the file. Use Export Invoices PDF for the plain export.',
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
      path: '/invoices/print',
      query: { organization_id: organizationId, invoice_ids: invoiceIdsList.join(',') },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? 'invoices-print.pdf',
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
