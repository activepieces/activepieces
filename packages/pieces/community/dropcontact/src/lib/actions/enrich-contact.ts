import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichContact } from '../api';
import { dropcontactAuth } from '../auth';

export const enrichContactAction = createAction({
  name: 'enrich-contact',
  auth: dropcontactAuth,
  displayName: 'Enrich Contact',
  description:
    'Enrich a contact with professional email and company data using Dropcontact.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to enrich or verify',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'Full name of the contact',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the contact',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Website URL of the company',
      required: false,
    }),
    siren: Property.Checkbox({
      displayName: 'Include SIREN Data',
      description:
        'If true, the response will include SIREN number, NAF code, VAT number, company address, and company leader information.',
      required: false,
      defaultValue: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language for the response results',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'French', value: 'fr' },
        ],
      },
      defaultValue: 'en',
    }),
  },
  async run(context) {
    const { email, firstName, lastName, fullName, phone, company, website, siren, language } =
      context.propsValue;

    if (!email && !firstName && !lastName && !fullName && !phone && !company && !website) {
      throw new Error(
        'At least one contact field (email, name, phone, company, or website) must be provided.'
      );
    }

    const contact: Record<string, unknown> = {};
    if (email) contact['email'] = email;
    if (firstName) contact['first_name'] = firstName;
    if (lastName) contact['last_name'] = lastName;
    if (fullName) contact['full_name'] = fullName;
    if (phone) contact['phone'] = phone;
    if (company) contact['company'] = company;
    if (website) contact['website'] = website;

    const response = await enrichContact({
      auth: context.auth,
      contact,
      siren,
      language,
    });

    return response;
  },
});
