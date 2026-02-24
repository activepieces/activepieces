import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const createCompanyAction = createAction({
  auth: bexioAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Create a new company contact',
  props: {
    name_1: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: true,
    }),
    name_2: Property.ShortText({
      displayName: 'Company Addition',
      description: 'Additional company name (e.g., "Ltd.", "Inc.")',
      required: false,
    }),
    nr: Property.ShortText({
      displayName: 'Contact Number',
      description: 'Contact number (leave empty to auto-assign)',
      required: false,
    }),
    salutation_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Salutation',
      description: 'Salutation for the company',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const salutations = await client.get<Array<{ id: number; name: string }>>('/2.0/salutation');
          return {
            disabled: false,
            options: salutations.map((sal) => ({
              label: sal.name,
              value: sal.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load salutations',
            options: [],
          };
        }
      },
    }),
    title_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Title',
      description: 'Title for the company',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const titles = await client.get<Array<{ id: number; name: string }>>('/2.0/title');

          return {
            disabled: false,
            options: titles.map((title) => ({
              label: title.name,
              value: title.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load titles',
            options: [],
          };
        }
      },
    }),
    street_name: Property.ShortText({
      displayName: 'Street Name',
      description: 'Street name',
      required: false,
    }),
    house_number: Property.ShortText({
      displayName: 'House Number',
      description: 'House number',
      required: false,
    }),
    address_addition: Property.ShortText({
      displayName: 'Address Addition',
      description: 'Additional address information (e.g., "Building C")',
      required: false,
    }),
    postcode: Property.ShortText({
      displayName: 'Postcode',
      description: 'Postal code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    country_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Country',
      description: 'Country',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const countries = await client.get<Array<{ id: number; name: string; name_short: string; iso3166_alpha2: string }>>('/2.0/country');

          return {
            disabled: false,
            options: countries.map((country) => ({
              label: country.name,
              value: country.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load countries',
            options: [],
          };
        }
      },
    }),
    mail: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address',
      required: false,
    }),
    mail_second: Property.ShortText({
      displayName: 'Secondary Email',
      description: 'Secondary email address',
      required: false,
    }),
    phone_fixed: Property.ShortText({
      displayName: 'Phone',
      description: 'Fixed phone number',
      required: false,
    }),
    phone_fixed_second: Property.ShortText({
      displayName: 'Secondary Phone',
      description: 'Secondary fixed phone number',
      required: false,
    }),
    phone_mobile: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'Mobile phone number',
      required: false,
    }),
    fax: Property.ShortText({
      displayName: 'Fax',
      description: 'Fax number',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL',
      required: false,
    }),
    skype_name: Property.ShortText({
      displayName: 'Skype Name',
      description: 'Skype username',
      required: false,
    }),
    remarks: Property.LongText({
      displayName: 'Remarks',
      description: 'Additional notes about the company',
      required: false,
    }),
    language_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Language',
      description: 'Preferred language',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const languages = await client.get<Array<{ id: number; name: string }>>('/2.0/language');

          return {
            disabled: false,
            options: languages.map((lang) => ({
              label: lang.name,
              value: lang.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load languages',
            options: [],
          };
        }
      },
    }),
    contact_group_ids: Property.MultiSelectDropdown({
      auth: bexioAuth,
      displayName: 'Contact Groups',
      description: 'Select contact groups',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const groups = await client.get<Array<{ id: number; name: string }>>('/2.0/contact_group');

          return {
            disabled: false,
            options: groups.map((group) => ({
              label: group.name,
              value: group.id.toString(),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contact groups',
            options: [],
          };
        }
      },
    }),
    contact_branch_ids: Property.MultiSelectDropdown({
      auth: bexioAuth,
      displayName: 'Contact Sectors',
      description: 'Select contact sectors',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const branches = await client.get<Array<{ id: number; name: string }>>('/2.0/contact_branch');

          return {
            disabled: false,
            options: branches.map((branch) => ({
              label: branch.name,
              value: branch.id.toString(),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contact sectors',
            options: [],
          };
        }
      },
    }),
    user_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'User',
      description: 'User assigned to this contact',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const users = await client.get<Array<{ id: number; firstname: string | null; lastname: string | null; email: string }>>('/3.0/users');

          return {
            disabled: false,
            options: users.map((user) => ({
              label: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load users',
            options: [],
          };
        }
      },
    }),
    owner_id: Property.Dropdown({
      auth: bexioAuth,
      displayName: 'Owner',
      description: 'Owner of this contact',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const users = await client.get<Array<{ id: number; firstname: string | null; lastname: string | null; email: string }>>('/3.0/users');

          return {
            disabled: false,
            options: users.map((user) => ({
              label: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load users',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const client = new BexioClient(context.auth);

    const props = context.propsValue;
    const requestBody: Record<string, unknown> = {
      contact_type_id: 1, // 1 = company
      name_1: props['name_1'],
      user_id: props['user_id'],
      owner_id: props['owner_id'],
    };

    // Add optional fields only if they have values
    if (props['name_2']) {
      requestBody['name_2'] = props['name_2'];
    }
    if (props['nr'] !== undefined && props['nr'] !== null && props['nr'] !== '') {
      requestBody['nr'] = props['nr'];
    } else {
      requestBody['nr'] = null; // Auto-assign
    }
    if (props['salutation_id']) {
      requestBody['salutation_id'] = props['salutation_id'];
    }
    if (props['title_id']) {
      requestBody['title_id'] = props['title_id'];
    }
    if (props['street_name']) {
      requestBody['street_name'] = props['street_name'];
    }
    if (props['house_number']) {
      requestBody['house_number'] = props['house_number'];
    }
    if (props['address_addition']) {
      requestBody['address_addition'] = props['address_addition'];
    }
    if (props['postcode']) {
      requestBody['postcode'] = props['postcode'];
    }
    if (props['city']) {
      requestBody['city'] = props['city'];
    }
    if (props['country_id']) {
      requestBody['country_id'] = props['country_id'];
    }
    if (props['mail']) {
      requestBody['mail'] = props['mail'];
    }
    if (props['mail_second']) {
      requestBody['mail_second'] = props['mail_second'];
    }
    if (props['phone_fixed']) {
      requestBody['phone_fixed'] = props['phone_fixed'];
    }
    if (props['phone_fixed_second']) {
      requestBody['phone_fixed_second'] = props['phone_fixed_second'];
    }
    if (props['phone_mobile']) {
      requestBody['phone_mobile'] = props['phone_mobile'];
    }
    if (props['fax']) {
      requestBody['fax'] = props['fax'];
    }
    if (props['url']) {
      requestBody['url'] = props['url'];
    }
    if (props['skype_name']) {
      requestBody['skype_name'] = props['skype_name'];
    }
    if (props['remarks']) {
      requestBody['remarks'] = props['remarks'];
    }
    if (props['language_id']) {
      requestBody['language_id'] = props['language_id'];
    }
    if (props['contact_group_ids'] && Array.isArray(props['contact_group_ids']) && props['contact_group_ids'].length > 0) {
      requestBody['contact_group_ids'] = props['contact_group_ids'].join(',');
    }
    if (props['contact_branch_ids'] && Array.isArray(props['contact_branch_ids']) && props['contact_branch_ids'].length > 0) {
      requestBody['contact_branch_ids'] = props['contact_branch_ids'].join(',');
    }

    const response = await client.post('/2.0/contact', requestBody);

    return response;
  },
});

