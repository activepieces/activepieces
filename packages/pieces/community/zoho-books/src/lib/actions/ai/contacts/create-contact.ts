import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const createContactAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_contact',
  displayName: 'Create Contact',
  description: 'Creates a customer or vendor in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a customer or vendor and returns it with its contact_id. Each call creates a new contact; use List Contacts first to avoid duplicates, or Upsert Contact by Custom Field.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Display name of the contact, e.g. "Bowman and Co".',
      required: true,
    }),
    contactType: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Defaults to customer.',
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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the primary contact person.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the primary contact person.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the primary contact person.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone of the primary contact person.',
      required: false,
    }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    currencyId: Property.ShortText({
      displayName: 'Currency ID',
      description: 'Currency ID of the contact. Defaults to the organization base currency.',
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
        'Other contact fields, e.g. {"credit_limit": 1000, "contact_persons": [{"first_name": "...", "email": "...", "is_primary_contact": true}], "custom_fields": [{"api_name": "cf_x", "value": "..."}], "tax_id": "...", "pricebook_id": "...", "owner_id": "...", "language_code": "en"}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const {
      contactName,
      contactType,
      customerSubType,
      companyName,
      email,
      firstName,
      lastName,
      phone,
      website,
      currencyId,
      paymentTerms,
      paymentTermsLabel,
      notes,
      billingAddress,
      shippingAddress,
      additionalFields,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const hasPrimaryPerson = [email, firstName, lastName, phone].some(
      (value) => value !== undefined,
    );
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/contacts',
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        contact_name: contactName,
        ...spreadIfDefined('contact_type', contactType),
        ...spreadIfDefined('customer_sub_type', customerSubType),
        ...spreadIfDefined('company_name', companyName),
        ...spreadIfDefined('website', website),
        ...spreadIfDefined('currency_id', currencyId),
        ...spreadIfDefined('payment_terms', paymentTerms),
        ...spreadIfDefined('payment_terms_label', paymentTermsLabel),
        ...spreadIfDefined('notes', notes),
        ...spreadIfDefined('billing_address', billingAddress),
        ...spreadIfDefined('shipping_address', shippingAddress),
        ...(hasPrimaryPerson
          ? {
              contact_persons: [
                {
                  first_name: firstName,
                  last_name: lastName,
                  email,
                  phone,
                  is_primary_contact: true,
                },
              ],
            }
          : {}),
      },
    });
  },
});
