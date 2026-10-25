import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const removeInvoiceSubstatusAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_remove_invoice_substatus',
  displayName: 'Remove Invoice Substatus',
  description: 'Removes a custom sub-status from a Zoho Books invoice.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a custom sub-status applied with Apply Invoice Substatus from an invoice. Needs custom sub-statuses configured in Zoho Books.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    substatusId: Property.ShortText({
      displayName: 'Substatus ID',
      description: 'ID of the custom substatus applied to the invoice, e.g. "inv_review".',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, substatusId } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/invoices/${encodeURIComponent(invoiceId)}/substatus/${encodeURIComponent(
        substatusId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
