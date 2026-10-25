import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getCustomerPaymentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_customer_payment',
  displayName: 'Get Customer Payment',
  description: 'Gets a payment received from a customer in Zoho Books.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one customer payment by ID, with the invoices it is applied to, the amount refunded and its custom fields (with their customfield_id).',
    idempotent: true,
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
      method: HttpMethod.GET,
      path: `/customerpayments/${encodeURIComponent(context.propsValue.customerPaymentId)}`,
      query: { organization_id: organizationId },
    });
  },
});
