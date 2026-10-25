import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceAdvancedTrackingDetailsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_advanced_tracking_details',
  displayName: 'Get Invoice Advanced Tracking Details',
  description:
    'Gets the batch and serial number details of the line items of a Zoho Books invoice.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the batch or serial number tracking details of the line items of an invoice, which Update Invoice Advanced Tracking Details changes. Needs batch or serial number tracking enabled in Zoho Books.',
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
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/advancedtrackingdetails`,
      query: { organization_id: organizationId },
    });
  },
});
