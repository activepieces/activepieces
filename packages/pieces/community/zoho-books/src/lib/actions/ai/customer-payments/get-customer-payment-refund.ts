import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getCustomerPaymentRefundAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_customer_payment_refund',
  displayName: 'Get Customer Payment Refund',
  description: 'Gets a refund of a customer payment in Zoho Books.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one refund of a customer payment by ID, with its date, amount, refund mode and account.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
    refundId: Property.ShortText({
      displayName: 'Refund ID',
      description:
        'Refund ID (payment_refund_id), from List Customer Payment Refunds or Create Customer Payment Refund.',
      required: true,
    }),
  },
  async run(context) {
    const { customerPaymentId, refundId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/customerpayments/${encodeURIComponent(
        customerPaymentId,
      )}/refunds/${encodeURIComponent(refundId)}`,
      query: { organization_id: organizationId },
    });
  },
});
