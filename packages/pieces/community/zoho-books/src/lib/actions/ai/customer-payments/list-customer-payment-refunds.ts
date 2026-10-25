import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const listCustomerPaymentRefundsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_customer_payment_refunds',
  displayName: 'List Customer Payment Refunds',
  description: 'Lists the refunds of a customer payment in Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the refunds made from one customer payment with their payment_refund_id. Returns one page; page_context.has_more_page tells whether to fetch the next page.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
    page: zohoBooksAiProps.page(),
    perPage: zohoBooksAiProps.perPage(),
  },
  async run(context) {
    const { customerPaymentId, page, perPage } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/customerpayments/${encodeURIComponent(customerPaymentId)}/refunds`,
      query: {
        organization_id: organizationId,
        ...zohoBooksUtils.pageQuery({ page, perPage }),
      },
    });
  },
});
