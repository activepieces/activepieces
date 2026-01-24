import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { t } from 'i18next';

export const createCustomer = createAction({
  auth: bokioAuth,
  name: 'createCustomer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Bokio',
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
      description: 'Customer address line 1',
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
    const {
      customerName,
      type,
      vatNumber,
      orgNumber,
      paymentTerms,
      customerNumber,
      email,
      phone,
      lin1,
      line2,
      zipCode,
      city,
      country,
    } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const body: any = {
      name: customerName,
      type: type,
    };
    if (vatNumber) {
      body.vat_number = vatNumber;
    }
    if (orgNumber) {
      body.org_number = orgNumber;
    }
    if (customerNumber) {
      body.customer_number = customerNumber;
    }
    if (paymentTerms) {
      body.payment_terms = paymentTerms;
    }
    const contactsDetails: any = {};
    if (email) {
      contactsDetails.email = email;
    }
    if (phone) {
      contactsDetails.phone = phone;
    }

    if (Object.keys(contactsDetails).length > 0) {
      body.contactsDetails = contactsDetails;
    }
    const addressDetails: any = {};
    if (lin1) {
      addressDetails.line_1 = lin1;
    }
    if (line2) {
      addressDetails.line_2 = line2;
    }
    if (zipCode) {
      addressDetails.zip_code = zipCode;
    }
    if (city) {
      addressDetails.city = city;
    }
    if (country) {
      addressDetails.country = country;
    }

    if (Object.keys(addressDetails).length > 0) {
      body.address = addressDetails;
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      `/companies/${companyId}/customers`,
      body
    );

    return response;
  },
});
