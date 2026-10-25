import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const createInvoiceFromSalesOrderAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_invoice_from_sales_order',
  displayName: 'Create Invoice from Sales Order',
  description: 'Creates an invoice from a confirmed sales order in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an invoice for everything on a confirmed sales order and returns it with its invoice_id. Needs sales orders enabled in Zoho Books. Each call creates another invoice.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    salesOrderId: Property.ShortText({
      displayName: 'Sales Order ID',
      description:
        'ID of a confirmed sales order in Zoho Books (the salesorder_id of the sales order).',
      required: true,
    }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/fromsalesorder',
      query: { organization_id: organizationId, salesorder_id: context.propsValue.salesOrderId },
    });
  },
});
