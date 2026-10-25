import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceMetadataAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_metadata',
  displayName: 'Get Invoice Metadata',
  description: 'Gets a metadata value stored against a Zoho Books invoice.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the metadata value stored under a name against an invoice; Update Invoice Metadata sets it.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    metadataName: Property.ShortText({
      displayName: 'Metadata Name',
      description: 'Name of the metadata key, e.g. "external_status".',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, metadataName } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/invoices/${encodeURIComponent(invoiceId)}/metadata/${encodeURIComponent(
        metadataName,
      )}`,
      query: { organization_id: organizationId },
    });
  },
});
