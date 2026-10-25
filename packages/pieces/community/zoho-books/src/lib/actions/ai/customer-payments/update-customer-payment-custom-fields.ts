import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateCustomerPaymentCustomFieldsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_customer_payment_custom_fields',
  displayName: 'Update Customer Payment Custom Fields',
  description: 'Sets custom field values on an existing customer payment in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the given custom field values on a customer payment; other custom fields and payment details are left as they are. Get Customer Payment returns the payment custom fields with their customfield_id.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerPaymentId: zohoBooksAiProps.customerPaymentId({ required: true }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description:
        'Custom field values to set, e.g. [{"customfield_id": "46000000012845", "value": "Normal"}].',
      required: true,
      properties: {
        customfield_id: Property.ShortText({ displayName: 'Custom Field ID', required: true }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
  },
  async run(context) {
    const { customerPaymentId, customFields } = context.propsValue;
    if (customFields.length === 0) {
      throw new Error('Custom Fields must contain at least one custom field.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/customerpayment/${encodeURIComponent(customerPaymentId)}/customfields`,
      query: { organization_id: organizationId },
      body: customFields,
    });
  },
});
