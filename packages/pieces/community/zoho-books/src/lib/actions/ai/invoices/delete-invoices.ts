import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const deleteInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_invoices',
  displayName: 'Delete Invoices',
  description: 'Deletes several invoices in Zoho Books.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes several invoices in one call; it cannot be undone. Use Delete Invoice for one invoice, or Void Invoice to keep the record.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Invoice IDs to delete, from List Invoices or Create Invoice.',
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
      method: HttpMethod.DELETE,
      path: '/invoices',
      query: { organization_id: organizationId, invoice_ids: invoiceIdsList.join(',') },
    });
  },
});
