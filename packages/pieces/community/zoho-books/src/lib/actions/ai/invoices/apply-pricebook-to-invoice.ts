import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const applyPricebookToInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_apply_pricebook_to_invoice',
  displayName: 'Apply Price Book To Invoice',
  description: 'Applies a price book to a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a price book (price list) to an invoice so its line items use the price book rates. Needs price lists enabled in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    pricebookId: Property.ShortText({
      displayName: 'Price Book ID',
      description:
        'Price book (price list) ID, from Zoho Books (the pricebook_id of the price list).',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, pricebookId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/pricebooks/${encodeURIComponent(
        pricebookId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
