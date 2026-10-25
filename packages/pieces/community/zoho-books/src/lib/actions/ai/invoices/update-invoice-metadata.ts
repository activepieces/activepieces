import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateInvoiceMetadataAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_metadata',
  displayName: 'Update Invoice Metadata',
  description: 'Updates a metadata value stored against a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the metadata value stored under a name against an invoice; Get Invoice Metadata reads it back.',
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
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Request body with the metadata to store, e.g. {"value": "synced"}.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, metadataName, metadata } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoices/${encodeURIComponent(invoiceId)}/metadata/${encodeURIComponent(
        metadataName,
      )}`,
      query: { organization_id: organizationId },
      body: metadata,
    });
  },
});
