import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const getInvoiceDeliveryNotesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_delivery_notes',
  displayName: 'Get Invoice Delivery Notes',
  description: 'Gets the delivery notes of several Zoho Books invoices as one PDF file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Generates the delivery notes of several invoices as one PDF file and returns the file. Use Print Invoice Delivery Note for a single invoice.',
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
      description: 'Whether to return the delivery notes in a print-ready format.',
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
      path: '/invoices/deliverynotes',
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
        fileName: file.fileName ?? 'delivery-notes.pdf',
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
