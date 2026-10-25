import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const linkInvoicesToSalesOrderAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_link_invoices_to_sales_order',
  displayName: 'Link Invoices to Sales Order',
  description: 'Associates existing invoices with their sales orders in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Associates existing invoices with their matching sales orders. Needs sales orders enabled in Zoho Books. Invoices that could not be linked are listed in the errors of the response, with the reason.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Invoice IDs to link, from List Invoices.',
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
      path: '/invoices/mapwithorder',
      query: { organization_id: organizationId, invoice_ids: invoiceIdsList.join(',') },
    });
  },
});
