import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import { nutshellApiCall, unwrapFirst } from '../common/client';

export const createCompany = createAction({
  auth: nutshellAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Creates a new company (account) in Nutshell.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new company in Nutshell with a name and optional description, phone, email, website, address, and links to existing contacts. Use to record a new organization. Not idempotent: calling it repeatedly creates duplicate companies.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website URL',
      required: false,
    }),
    addressLine1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State / Province',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    contactIds: Property.Array({
      displayName: 'Contact IDs',
      description: 'IDs of contacts to link to this company, e.g. "34-contacts".',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Key-value pairs matching custom field names configured in Nutshell.',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      description,
      phone,
      email,
      website,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      contactIds,
      customFields,
    } = context.propsValue;

    const account: Record<string, unknown> = { name };
    if (description) account['description'] = description;
    if (phone) account['phones'] = [{ isPrimary: true, value: phone }];
    if (email) account['emails'] = [{ value: email }];
    if (website) account['urls'] = [{ value: website }];
    if (addressLine1 || city || state || postalCode || country) {
      account['addresses'] = [
        {
          isPrimary: true,
          value: {
            address_1: addressLine1,
            city,
            state,
            postalCode,
            country,
          },
        },
      ];
    }
    if (customFields) account['customFields'] = customFields;
    if (contactIds && contactIds.length > 0) {
      account['links'] = { contacts: contactIds };
    }

    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/accounts',
      body: { accounts: [account] },
    });

    return unwrapFirst(response, 'accounts');
  },
});
