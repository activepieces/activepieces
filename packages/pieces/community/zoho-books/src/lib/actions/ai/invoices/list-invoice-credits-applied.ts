import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const listInvoiceCreditsAppliedAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_invoice_credits_applied',
  displayName: 'List Invoice Credits Applied',
  description: 'Lists the credits applied to an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the credit notes applied to one invoice, each with the creditnotes_invoice_id that Delete Invoice Applied Credit takes.',
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
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/creditsapplied`,
      query: { organization_id: organizationId },
    });
  },
});
