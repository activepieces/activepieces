import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const createInvoicesFromEstimatesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_invoices_from_estimates',
  displayName: 'Create Invoices From Estimates',
  description: 'Creates Zoho Books invoices from estimates.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Converts the given accepted estimates into invoices and returns them with their invoice_id. Each call creates new invoices, so do not repeat it for the same estimates.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    estimateIds: Property.Array({
      displayName: 'Estimate IDs',
      description: 'IDs of accepted estimates, from Zoho Books (the estimate_id of each estimate).',
      required: true,
    }),
  },
  async run(context) {
    const { estimateIds } = context.propsValue;
    const estimateIdsList = zohoBooksUtils.toStringList({
      value: estimateIds,
      propName: 'Estimate IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/fromestimates',
      query: {
        organization_id: organizationId,
        estimate_ids: estimateIdsList.join(','),
      },
    });
  },
});
