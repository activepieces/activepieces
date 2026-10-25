import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceByReferenceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_by_reference',
  displayName: 'Get Invoice By Reference',
  description: 'Gets a Zoho Books invoice by its reference ID from an external system.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets an invoice by the reference ID an external system knows it by, returning its invoice_id. Use Get Invoice when the invoice_id is known.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    referenceId: Property.ShortText({
      displayName: 'Reference ID',
      description: 'Reference ID of the invoice from the external system, e.g. "982000000567114".',
      required: true,
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
      path: `/invoices/reference/${encodeURIComponent(context.propsValue.referenceId)}`,
      query: { organization_id: organizationId },
    });
  },
});
