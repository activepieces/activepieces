import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const deleteCustomerPaymentsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_customer_payments',
  displayName: 'Delete Customer Payments',
  description: 'Deletes several customer payments in Zoho Books at once.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes several customer payments in one call; the invoices they paid become unpaid again. It cannot be undone. Use Delete Customer Payment for a single payment.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    paymentIds: Property.Array({
      displayName: 'Customer Payment IDs',
      description: 'IDs of the payments to delete, from List Customer Payments.',
      required: true,
    }),
  },
  async run(context) {
    const { paymentIds } = context.propsValue;
    const paymentIdsList = zohoBooksUtils.toStringList({
      value: paymentIds,
      propName: 'Customer Payment IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: '/customerpayments',
      query: {
        organization_id: organizationId,
        payment_ids: paymentIdsList.join(','),
        bulk_delete: 'true',
      },
    });
  },
});
