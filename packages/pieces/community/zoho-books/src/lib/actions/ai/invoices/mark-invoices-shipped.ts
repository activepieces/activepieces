import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const markInvoicesShippedAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_invoices_shipped',
  displayName: 'Mark Invoices Shipped',
  description: 'Marks several Zoho Books invoices as shipped.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks several invoices as shipped in one call; Unship Invoices reverts it. Needs inventory tracking (packages and shipments) enabled in Zoho Books.',
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
      path: '/invoices/markasshipped',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
      },
    });
  },
});
