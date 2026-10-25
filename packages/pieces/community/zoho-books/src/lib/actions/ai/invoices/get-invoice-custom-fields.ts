import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceCustomFieldsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_custom_fields',
  displayName: 'Get Invoice Custom Fields',
  description: 'Gets the custom fields of a Zoho Books invoice.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the custom fields configured for an invoice with their customfield_id, which Update Invoice Custom Fields takes.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/customfields`,
      query: { organization_id: organizationId },
    });
  },
});
