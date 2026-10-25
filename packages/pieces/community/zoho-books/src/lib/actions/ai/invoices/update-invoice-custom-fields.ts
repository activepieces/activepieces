import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateInvoiceCustomFieldsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_invoice_custom_fields',
  displayName: 'Update Invoice Custom Fields',
  description: 'Updates custom field values of an existing Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the values of the given custom fields on an invoice without touching its other fields. Custom field IDs come from Get Invoice Custom Fields or the custom_fields of Get Invoice.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description:
        'Custom field values to set, e.g. [{"customfield_id": "46000000012845", "value": "Normal"}].',
      required: true,
      properties: {
        customfield_id: Property.ShortText({
          displayName: 'Custom Field ID',
          description: 'From Get Invoice Custom Fields.',
          required: true,
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
  },
  async run(context) {
    const { invoiceId, customFields } = context.propsValue;
    if (customFields.length === 0) {
      throw new Error('Custom Fields must list at least one custom field.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/invoice/${encodeURIComponent(invoiceId)}/customfields`,
      query: { organization_id: organizationId },
      body: customFields,
    });
  },
});
