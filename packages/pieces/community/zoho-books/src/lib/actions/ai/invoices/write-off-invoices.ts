import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const writeOffInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_write_off_invoices',
  displayName: 'Write Off Invoices',
  description: 'Writes off the balance of several Zoho Books invoices.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Writes off the unpaid balance of several invoices in one call; use Write Off Invoice for one, and Cancel Invoice Write Off to undo one.',
    idempotent: false,
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
      path: '/invoices/writeoff',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
      },
    });
  },
});
