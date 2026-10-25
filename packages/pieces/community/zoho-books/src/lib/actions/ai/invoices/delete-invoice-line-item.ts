import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteInvoiceLineItemAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_invoice_line_item',
  displayName: 'Delete Invoice Line Item',
  description: 'Deletes a line item from a Zoho Books invoice.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one line item from an invoice. It cannot be undone. The line_item_id comes from the line_items of Get Invoice.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    lineItemId: Property.ShortText({
      displayName: 'Line Item ID',
      description: 'Line item ID, from the line_items of Get Invoice.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, lineItemId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(invoiceId)}/lineitems/${encodeURIComponent(
        lineItemId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
