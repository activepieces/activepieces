import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const submitInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_submit_invoices',
  displayName: 'Submit Invoices',
  description: 'Submits several Zoho Books invoices for approval.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Submits several draft invoices for approval in one call; use Submit Invoice for one, then Approve Invoices. Needs the invoice approval workflow enabled in Zoho Books.',
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
      path: '/invoices/submit',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
      },
    });
  },
});
