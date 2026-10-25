import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const rejectInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_reject_invoice',
  displayName: 'Reject Invoice',
  description: 'Rejects a Zoho Books invoice that is pending approval.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Rejects an invoice that is pending approval, with an optional reason; use Approve Invoice to approve it instead. Needs the invoice approval workflow enabled in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    reason: Property.LongText({
      displayName: 'Reason',
      description: 'Reason for rejecting the invoice, up to 500 characters.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceId, reason } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/reject`,
      query: { organization_id: organizationId, reason },
    });
  },
});
