import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const applyInvoiceSubstatusAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_apply_invoice_substatus',
  displayName: 'Apply Invoice Substatus',
  description: 'Applies a custom sub-status to a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a custom sub-status to an invoice; Remove Invoice Substatus takes it off. Needs custom sub-statuses configured in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    substatusId: Property.ShortText({
      displayName: 'Substatus ID',
      description: 'ID of a custom substatus configured in Zoho Books, e.g. "inv_review".',
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
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/substatus/${encodeURIComponent(
        substatusId,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
