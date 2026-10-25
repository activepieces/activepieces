import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteCustomerPaymentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_customer_payment',
  displayName: 'Delete Customer Payment',
  description: 'Deletes a payment received from a customer in Zoho Books.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one customer payment; the invoices it paid become unpaid again. It cannot be undone. Use Delete Customer Payments for several at once.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/customerpayments/${encodeURIComponent(context.propsValue.customerPaymentId)}`,
      query: { organization_id: organizationId },
    });
  },
});
