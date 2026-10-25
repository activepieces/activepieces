import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const markInvoicesSentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_invoices_sent',
  displayName: 'Mark Invoices Sent',
  description: 'Marks several Zoho Books invoices as sent.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the status of several draft invoices to sent without emailing them; use Mark Invoice Sent for one, or Email Invoices to actually send them.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Invoice IDs, from List Invoices or Create Invoice.',
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
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/status/sent',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
      },
    });
  },
});
