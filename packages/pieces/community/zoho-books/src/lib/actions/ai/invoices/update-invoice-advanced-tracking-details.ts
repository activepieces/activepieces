import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateInvoiceAdvancedTrackingDetailsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_advanced_tracking_details',
  displayName: 'Update Invoice Advanced Tracking Details',
  description:
    'Updates the batch and serial number details of the line items of a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the batch or serial number tracking details of the line items of an invoice, in the shape Get Invoice Advanced Tracking Details returns. Needs batch or serial number tracking enabled in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    trackingDetails: Property.Json({
      displayName: 'Tracking Details',
      description:
        'Request body with the tracking details per line item, in the shape Get Invoice Advanced Tracking Details returns, e.g. {"line_items": [{"line_item_id": "982000000567300", "serial_numbers": ["SN-001", "SN-002"]}]}.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, trackingDetails } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/advancedtrackingdetails`,
      query: { organization_id: organizationId },
      body: trackingDetails,
    });
  },
});
