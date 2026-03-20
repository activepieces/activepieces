import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { katanaAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';

interface AddressInput {
  entity_type: string;
  default?: boolean;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  line_1?: string;
  line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export const createCustomer = createAction({
  auth: katanaAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Katana.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Customer display name.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (ISO 4217), e.g. USD, EUR, GBP.',
      required: false,
    }),
    reference_id: Property.ShortText({
      displayName: 'Reference ID',
      description: 'External reference ID (max 100 characters).',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Customer category (max 100 characters).',
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Additional notes about the customer.',
      required: false,
    }),
    discount_rate: Property.Number({
      displayName: 'Discount Rate',
      description: 'Default discount rate for this customer.',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      required: false,
      properties: {
        entity_type: Property.StaticDropdown({
          displayName: 'Address Type',
          required: true,
          options: {
            options: [
              { label: 'Billing', value: 'billing' },
              { label: 'Shipping', value: 'shipping' },
            ],
          },
        }),
        default: Property.Checkbox({
          displayName: 'Set as Default',
          required: false,
        }),
        first_name: Property.ShortText({
          displayName: 'First Name',
          required: false,
        }),
        last_name: Property.ShortText({
          displayName: 'Last Name',
          required: false,
        }),
        company: Property.ShortText({
          displayName: 'Company',
          required: false,
        }),
        phone: Property.ShortText({
          displayName: 'Phone',
          required: false,
        }),
        line_1: Property.ShortText({
          displayName: 'Address Line 1',
          required: false,
        }),
        line_2: Property.ShortText({
          displayName: 'Address Line 2',
          required: false,
        }),
        city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        state: Property.ShortText({
          displayName: 'State',
          required: false,
        }),
        zip: Property.ShortText({
          displayName: 'Zip/Postal Code',
          required: false,
        }),
        country: Property.ShortText({
          displayName: 'Country',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      name,
      first_name,
      last_name,
      company,
      email,
      phone,
      currency,
      reference_id,
      category,
      comment,
      discount_rate,
      addresses,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      name,
    };

    if (first_name) body['first_name'] = first_name;
    if (last_name) body['last_name'] = last_name;
    if (company) body['company'] = company;
    if (email) body['email'] = email;
    if (phone) body['phone'] = phone;
    if (currency) body['currency'] = currency;
    if (reference_id) body['reference_id'] = reference_id;
    if (category) body['category'] = category;
    if (comment) body['comment'] = comment;
    if (discount_rate !== undefined && discount_rate !== null) {
      body['discount_rate'] = discount_rate;
    }

    if (addresses && addresses.length > 0) {
      body['addresses'] = (addresses as AddressInput[]).map((addr) => {
        const address: Record<string, unknown> = {
          entity_type: addr.entity_type,
        };

        if (addr.default !== undefined) address['default'] = addr.default;
        if (addr.first_name) address['first_name'] = addr.first_name;
        if (addr.last_name) address['last_name'] = addr.last_name;
        if (addr.company) address['company'] = addr.company;
        if (addr.phone) address['phone'] = addr.phone;
        if (addr.line_1) address['line_1'] = addr.line_1;
        if (addr.line_2) address['line_2'] = addr.line_2;
        if (addr.city) address['city'] = addr.city;
        if (addr.state) address['state'] = addr.state;
        if (addr.zip) address['zip'] = addr.zip;
        if (addr.country) address['country'] = addr.country;

        return address;
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/customers`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as unknown as string,
      },
      body,
    });

    return response.body;
  },
});
