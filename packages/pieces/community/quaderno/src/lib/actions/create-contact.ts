import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { quadernoAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: quadernoAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Quaderno (customer or vendor)',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name (required for person contacts)",
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "The contact's last name (optional)",
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The contact's email address",
      required: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: "The contact's full name",
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'The type of contact',
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Company', value: 'company' },
        ],
      },
      required: false,
    }),

    country: Property.ShortText({
      displayName: 'Country',
      description: '2-letter ISO country code (e.g., US, GB)',
      required: true,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City/District/Suburb/Town/Village',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      description: 'ZIP or postal code',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region/State',
      description: 'State/Province/Region',
      required: false,
    }),
    streetLine1: Property.ShortText({
      displayName: 'Street Address Line 1',
      description: 'Street address or PO Box',
      required: false,
    }),
    streetLine2: Property.ShortText({
      displayName: 'Street Address Line 2',
      description: 'Apartment/Suite/Unit/Building',
      required: false,
    }),
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      description: 'Tax identification number (VAT, ABN, etc.)',
      required: false,
    }),
    taxStatus: Property.StaticDropdown({
      displayName: 'Tax Status',
      description: 'Tax status of the contact',
      options: {
        options: [
          { label: 'Taxable', value: 'taxable' },
          { label: 'Exempt', value: 'exempt' },
          { label: 'Reverse', value: 'reverse' },
        ],
      },
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: '2-letter ISO language code (e.g., EN, FR, ES)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: "The contact's phone number",
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: "The contact's website URL",
      required: false,
    }),
    discount: Property.Number({
      displayName: 'Discount',
      description: 'Default discount for this contact (as a percentage)',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Internal notes about the contact',
      required: false,
    }),
    processorId: Property.ShortText({
      displayName: 'Processor ID',
      description:
        'The ID assigned by an external payment processor (e.g., Stripe customer ID)',
      required: false,
    }),
    processor: Property.ShortText({
      displayName: 'Processor',
      description:
        'The external platform where the contact was imported from (e.g., stripe)',
      required: false,
    }),
  },
  async run(context) {
    // Build contact data object
    const contactData: any = {
      first_name: context.propsValue.firstName,
      kind: context.propsValue.kind || 'person',
      country: context.propsValue.country,
    };

    // Add optional fields if provided
    if (context.propsValue.lastName) {
      contactData.last_name = context.propsValue.lastName;
    }
    if (context.propsValue.email) {
      contactData.email = context.propsValue.email;
    }
    if (context.propsValue.fullName) {
      contactData.full_name = context.propsValue.fullName;
    }
    if (context.propsValue.city) {
      contactData.city = context.propsValue.city;
    }
    if (context.propsValue.postalCode) {
      contactData.postal_code = context.propsValue.postalCode;
    }
    if (context.propsValue.region) {
      contactData.region = context.propsValue.region;
    }
    if (context.propsValue.streetLine1) {
      contactData.street_line_1 = context.propsValue.streetLine1;
    }
    if (context.propsValue.streetLine2) {
      contactData.street_line_2 = context.propsValue.streetLine2;
    }
    if (context.propsValue.taxId) {
      contactData.tax_id = context.propsValue.taxId;
    }
    if (context.propsValue.taxStatus) {
      contactData.tax_status = context.propsValue.taxStatus;
    }
    if (context.propsValue.language) {
      contactData.language = context.propsValue.language;
    }
    if (context.propsValue.phone) {
      contactData.phone_1 = context.propsValue.phone;
    }
    if (context.propsValue.website) {
      contactData.web = context.propsValue.website;
    }
    if (
      context.propsValue.discount !== undefined &&
      context.propsValue.discount !== null
    ) {
      contactData.discount = context.propsValue.discount;
    }
    if (context.propsValue.notes) {
      contactData.notes = context.propsValue.notes;
    }
    if (context.propsValue.processorId) {
      contactData.processor_id = context.propsValue.processorId;
    }
    if (context.propsValue.processor) {
      contactData.processor = context.propsValue.processor;
    }

    return await makeRequest(
      context.auth.props.account_name,
      context.auth.props.api_key,
      HttpMethod.POST,
      '/contacts',
      contactData
    );
  },
});
