import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceDashboardAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_dashboard',
  displayName: 'Get Invoice Dashboard',
  description: 'Gets the Zoho Books invoice dashboard with summary metrics.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the invoice dashboard of the organization with its summary metrics. Use List Invoices for the invoices themselves.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceAgent: Property.ShortText({
      displayName: 'Invoice Agent',
      description: 'Filters the dashboard data by the invoice agent.',
      required: false,
    }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/invoices/dashboard',
      query: { organization_id: organizationId, invoice_agent: context.propsValue.invoiceAgent },
    });
  },
});
