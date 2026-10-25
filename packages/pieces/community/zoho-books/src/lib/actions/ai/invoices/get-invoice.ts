import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice',
  displayName: 'Get Invoice',
  description: 'Gets an invoice from Zoho Books.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one invoice by invoice_id with its customer, line items, totals, status, balance and attached documents.',
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
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}`,
      query: { organization_id: organizationId },
    });
  },
});
