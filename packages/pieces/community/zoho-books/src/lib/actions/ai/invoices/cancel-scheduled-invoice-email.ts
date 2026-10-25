import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const cancelScheduledInvoiceEmailAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_cancel_scheduled_invoice_email',
  displayName: 'Cancel Scheduled Invoice Email',
  description: 'Cancels a scheduled email of a Zoho Books invoice.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Cancels the invoice email scheduled with Schedule Invoice Email before it is sent.',
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
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/email/schedule`,
      query: { organization_id: organizationId },
    });
  },
});
