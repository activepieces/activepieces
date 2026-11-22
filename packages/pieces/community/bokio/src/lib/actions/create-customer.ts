import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const createCustomer = createAction({
  auth: bokioAuth,
  name: 'createCustomer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Bokio',
  audience: 'both',
  aiMetadata: { description: 'Creates a new customer in a Bokio company and returns it with its id. Name and type (private or company) are required. Email/phone become the default contact. If any address field is given, address line 1, zip code, city and two-letter country code are all required. Language is sv or en. Not idempotent: each call creates another customer, so search with Find Customer first.', idempotent: false },
  outputSchema: bokioSchemas.customer,
  props: {
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Name of the customer',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Customer Type',
      description: 'Type of the customer',
      required: true,
      options: {
        options: [
          { label: 'Individual', value: 'private' },
          { label: 'Company', value: 'company' },
        ],
      },
    }),
    vatNumber: Property.ShortText({
      displayName: 'VAT Number',
      description: 'Customer VAT number',
      required: false,
    }),
    orgNumber: Property.ShortText({
      displayName: 'Organization Number',
      description: 'Customer organization number',
      required: false,
    }),
    paymentTerms: Property.ShortText({
      displayName: 'Payment Terms',
      description:
        'Payment terms for the customer. Payment terms for the invoices. Payment terms can both take free text or days, in digits, until the payment is due.',
      required: false,
    }),
    customerNumber: Property.ShortText({
      displayName: 'Customer Number',
      description: 'Customer number (optional)',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language used on documents sent to the customer',
      required: false,
      options: {
        options: [
          { label: 'Swedish', value: 'sv' },
          { label: 'English', value: 'en' },
        ],
      },
    }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Name of the contact person. Defaults to the customer name when email or phone is set.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Customer phone number',
      required: false,
    }),
    lin1: Property.ShortText({
      displayName: 'Address line 1',
      description: 'Customer address line 1. If any address field is set, line 1, zip code, city and country are all required.',
      required: false,
    }),
    line2: Property.ShortText({
      displayName: 'Address line 2',
      description: 'Customer address line 2',
      required: false,
    }),
    zipCode: Property.ShortText({
      displayName: 'Zip Code',
      description: 'Customer zip code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Customer city',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Customer country (ISO 3166-1 alpha-2 country code)',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = bokioBuilders.buildCustomerBody({
      name: p.customerName,
      type: p.type,
      vatNumber: p.vatNumber,
      orgNumber: p.orgNumber,
      paymentTerms: p.paymentTerms,
      customerNumber: p.customerNumber,
      language: p.language,
      contactName: p.contactName,
      email: p.email,
      phone: p.phone,
      line1: p.lin1,
      line2: p.line2,
      postalCode: p.zipCode,
      city: p.city,
      country: p.country,
    });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/customers',
      operation: 'create customer',
      body,
    });
  },
});
