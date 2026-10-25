import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const listInvoiceTemplatesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_invoice_templates',
  displayName: 'List Invoice Templates',
  description: 'Lists the invoice PDF templates of Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the invoice PDF templates with their template_id, which Update Invoice Template and the template_id field of Create Invoice take.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/invoices/templates',
      query: { organization_id: organizationId },
    });
  },
});
