import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateContactAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_contact',
  displayName: 'Update Contact',
  description: 'Updates a Zoho Books contact (customer or vendor).',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a customer or vendor by contact_id; only the fields given are sent. A contact_persons list in Additional Fields replaces the existing persons, so persons left out of it are removed; use Update Contact Person to change one person instead.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Display name of the contact, e.g. "Bowman and Co".',
      required: false,
    }),
    contactType: Property.StaticDropdown({
      displayName: 'Contact Type',
      required: false,
      options: {
        options: [
          { label: 'Customer', value: 'customer' },
          { label: 'Vendor', value: 'vendor' },
        ],
      },
    }),
    customerSubType: Property.StaticDropdown({
      displayName: 'Customer Sub Type',
      description: 'Customers only.',
      required: false,
      options: {
        options: [
          { label: 'Business', value: 'business' },
          { label: 'Individual', value: 'individual' },
        ],
      },
    }),
    companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    currencyId: Property.ShortText({
      displayName: 'Currency ID',
      description: 'Currency ID of the contact.',
      required: false,
    }),
    paymentTerms: Property.Number({
      displayName: 'Payment Terms',
      description: 'Days allowed for payment after the invoice date, e.g. 15.',
      required: false,
    }),
    paymentTermsLabel: Property.ShortText({
      displayName: 'Payment Terms Label',
      description: 'e.g. "Net 15".',
      required: false,
    }),
    creditLimit: Property.Number({
      displayName: 'Credit Limit',
      description: 'Customers only. Maximum outstanding receivable allowed, e.g. 1000.',
      required: false,
    }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    billingAddress: Property.Json({
      displayName: 'Billing Address',
      description:
        'e.g. {"attention": "Mr. John", "address": "4900 Hopyard Rd", "street2": "Suite 310", "city": "Pleasanton", "state": "CA", "zip": "94588", "country": "U.S.A", "phone": "+1-925-921-9201"}.',
      required: false,
    }),
    shippingAddress: Property.Json({
      displayName: 'Shipping Address',
      description: 'Same keys as Billing Address.',
      required: false,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other contact fields, e.g. {"contact_persons": [{"contact_person_id": "460000000026051", "first_name": "...", "email": "...", "is_primary_contact": true}], "custom_fields": [{"api_name": "cf_x", "value": "..."}], "tags": [{"tag_id": "...", "tag_option_id": "..."}], "tax_id": "...", "pricebook_id": "...", "owner_id": "...", "contact_number": "CNT-001234"}. contact_persons replaces the whole list: include contact_person_id for persons to keep. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      contactId,
      contactName,
      contactType,
      customerSubType,
      companyName,
      website,
      currencyId,
      paymentTerms,
      paymentTermsLabel,
      creditLimit,
      notes,
      billingAddress,
      shippingAddress,
      additionalFields,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/contacts/${encodeURIComponent(contactId)}`,
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        ...spreadIfDefined('contact_name', contactName),
        ...spreadIfDefined('contact_type', contactType),
        ...spreadIfDefined('customer_sub_type', customerSubType),
        ...spreadIfDefined('company_name', companyName),
        ...spreadIfDefined('website', website),
        ...spreadIfDefined('currency_id', currencyId),
        ...spreadIfDefined('payment_terms', paymentTerms),
        ...spreadIfDefined('payment_terms_label', paymentTermsLabel),
        ...spreadIfDefined('credit_limit', creditLimit),
        ...spreadIfDefined('notes', notes),
        ...spreadIfDefined('billing_address', billingAddress),
        ...spreadIfDefined('shipping_address', shippingAddress),
      },
    });
  },
});
