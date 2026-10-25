import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const emailInvoicePdfAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_email_invoice_pdf',
  displayName: 'Email Invoice PDF',
  description: 'Emails the PDF copy of a Zoho Books invoice to the customer.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails the PDF copy of an invoice to the customer. Each call sends another email; use Email Invoice to choose the recipients, subject and body.',
    idempotent: false,
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
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/mailpdf`,
      query: { organization_id: organizationId },
    });
  },
});
