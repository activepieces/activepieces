import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const getInvoicePackingSlipsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_packing_slips',
  displayName: 'Get Invoice Packing Slips',
  description: 'Gets the packing slips of several Zoho Books invoices as one PDF file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Generates the packing slips of several invoices as one PDF file and returns the file. Use Print Invoice Packing Slip for a single invoice.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Invoice IDs, from List Invoices or Create Invoice.',
      required: true,
    }),
    print: zohoBooksAiProps.flag({
      displayName: 'Print Ready',
      description: 'Whether to return the packing slips in a print-ready format.',
      required: false,
    }),
    noOfCopies: Property.Number({
      displayName: 'Number Of Copies',
      description: 'Number of copies to generate, e.g. 2.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceIds, print, noOfCopies } = context.propsValue;
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
      path: '/invoices/packingslips',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
        accept: 'pdf',
        print,
        no_of_copies: noOfCopies,
      },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? 'packing-slips.pdf',
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
