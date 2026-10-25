import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteCustomerPaymentRefundAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_customer_payment_refund',
  displayName: 'Delete Customer Payment Refund',
  description: 'Deletes a refund of a customer payment in Zoho Books.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a refund of a customer payment; the refunded amount becomes unused on the payment again. It cannot be undone.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: `/customerpayments/${encodeURIComponent(
        customerPaymentId,
      )}/refunds/${encodeURIComponent(refundId)}`,
      query: { organization_id: organizationId },
    });
  },
});
