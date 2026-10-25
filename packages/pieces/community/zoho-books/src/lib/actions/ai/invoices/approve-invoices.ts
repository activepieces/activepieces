import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const approveInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_approve_invoices',
  displayName: 'Approve Invoices',
  description: 'Approves several Zoho Books invoices that are pending approval.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Approves several invoices pending approval in one call; use Approve Invoice for one. Needs the invoice approval workflow enabled in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Invoice IDs, from List Invoices or Create Invoice.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceIds } = context.propsValue;
    const invoiceIdsList = zohoBooksUtils.toStringList({
      value: invoiceIds,
      propName: 'Invoice IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/approve',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
      },
    });
  },
});
