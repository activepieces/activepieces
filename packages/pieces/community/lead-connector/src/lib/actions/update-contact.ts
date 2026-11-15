import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  Country,
  getCountries,
  getTags,
  getTimezones,
  LeadConnectorContactDto,
  updateContact,
} from '../common';
import { requestBodyUtils } from '../common/request-body';
import { leadConnectorAuth } from '../..';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const updateContactAction = createAction({
  auth: leadConnectorAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Update an existing contact.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing GoHighLevel/LeadConnector contact identified by contact ID, overwriting any provided fields (name, email, phone, company, address, tags, source). Use to amend a known contact rather than create one. Idempotent — repeating with the same input leaves the contact in the same state.', idempotent: true },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact to update',
      icon: 'user',
      props: ['id', 'changesInfo'],
    },
    {
      key: 'name',
      display: 'section',
      label: 'Name',
      icon: 'user',
      props: ['firstName', 'lastName'],
    },
    {
      key: 'reach',
      display: 'section',
      label: 'Contact details',
      icon: 'inbox',
      props: ['email', 'phone', 'companyName', 'website'],
    },
    {
      key: 'address',
      display: 'section',
      label: 'Address',
      icon: 'location',
      props: ['address', 'city', 'state', 'postalCode', 'country', 'timezone'],
    },
    {
      key: 'tags',
      display: 'section',
      label: 'Tags and source',
      icon: 'tag',
      props: ['tags', 'source'],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Map it from a trigger or a Search Contacts step.',
      required: true,
    }),
    changesInfo: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      width: 'half',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      width: 'half',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      placeholder: 'jane@example.com',
      width: 'half',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Country code and digits only, no spaces.',
      required: false,
      placeholder: '+15551234567',
      width: 'half',
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
      width: 'half',
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
      placeholder: 'https://example.com',
      width: 'half',
    }),
    address: Property.LongText({
      displayName: 'Street Address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
      width: 'half',
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
      width: 'half',
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Country',
      description: 'In a dynamic value, use the two-letter code, e.g. US.',
      required: false,
      refreshers: [],
      options: async () => {
        const countries = await getCountries();
        return {
          options: countries.map((country: Country) => {
            return {
              label: country.name,
              value: country.iso2Code,
            };
          }),
        };
      },
    }),
    timezone: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Time Zone',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };

        const timezones = await getTimezones(auth);
        return {
          options: timezones.map((timezone) => {
            return {
              label: timezone,
              value: timezone,
            };
          }),
        };
      },
    }),
    tags: Property.MultiSelectDropdown({
      auth: leadConnectorAuth,
      displayName: 'Tags',
      description: 'Replaces the current tags. Leave empty to keep them.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };

        const tags = await getTags(auth);
        return {
          options: tags.map((tag) => {
            return {
              label: tag.name,
              value: tag.name,
            };
          }),
        };
      },
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where the lead came from.',
      required: false,
      placeholder: 'Facebook ad',
    }),
  },

  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      email: z.optional(z.string().check(z.email())),
      phone: z.optional(z.string()),
      website: z.optional(z.string().check(z.url())),
    });

    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      website,
      tags,
      source,
      country,
      city,
      state,
      address,
      postalCode,
      timezone,
    } = propsValue;

    const contact: LeadConnectorContactDto = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      companyName: companyName,
      website: website,
      tags: tags,
      source: source,
      country: country,
      city: city,
      state: state,
      address1: address,
      postalCode: postalCode,
      timezone: timezone,
    };

    return await updateContact(
      auth.access_token,
      id,
      requestBodyUtils.omitEmptyValues(contact)
    );
  },
});
