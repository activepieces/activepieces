import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const voidInvoicesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_void_invoices',
  displayName: 'Void Invoices',
  description: 'Marks several Zoho Books invoices as void.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Voids several invoices in one call; voided invoices stay on record but leave receivables. Use Void Invoice for one, and Mark Invoice Draft to reopen a voided invoice.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Invoice IDs, from List Invoices or Create Invoice.',
      required: true,
    }),
    canCreateNetworkEntity: zohoBooksAiProps.flag({
      displayName: 'Create Network Entity',
      description: 'Whether to create the corresponding network entity for the voided invoices.',
      required: false,
    }),
    unmapSalesorder: zohoBooksAiProps.flag({
      displayName: 'Unlink Sales Orders',
      description: 'Whether to unlink the sales orders associated with the voided invoices.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceIds, canCreateNetworkEntity, unmapSalesorder } = context.propsValue;
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
      path: '/invoices/status/void',
      query: {
        organization_id: organizationId,
        invoice_ids: invoiceIdsList.join(','),
        can_create_network_entity: canCreateNetworkEntity,
        unmap_salesorder: unmapSalesorder,
      },
    });
  },
});
