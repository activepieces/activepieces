import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const cancelInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_cancel_invoice',
  displayName: 'Cancel Invoice',
  description: 'Changes the status of a Zoho Books invoice to cancelled.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Changes the status of an invoice to cancelled. Use Void Invoice to void it instead, or Delete Invoice to remove it.',
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
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/status/cancel`,
      query: { organization_id: organizationId },
    });
  },
});
