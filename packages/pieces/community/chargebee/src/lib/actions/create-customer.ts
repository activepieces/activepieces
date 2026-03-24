import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest, cleanObject } from '../common/client';

type CreateCustomerProps = {
  id?: string;
  first_name: string;
  last_name?: string;
  email: string;
  company?: string;
  phone?: string;
  locale?: string;
  auto_collection?: 'on' | 'off';
};

export const createCustomer = createAction({
  name: 'create_customer',
  auth: chargebeeAuth,
  displayName: 'Create Customer',
  description: 'Create a customer in Chargebee.',
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Optional custom customer identifier.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Optional locale, for example en-US.',
      required: false,
    }),
    auto_collection: Property.StaticDropdown({
      displayName: 'Auto Collection',
      description:
        'Choose whether invoices should be automatically charged when possible.',
      required: false,
      options: {
        options: [
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
  },
  async run(context) {
    const props = context.propsValue as CreateCustomerProps;

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.POST,
      path: '/customers',
      contentType: 'application/x-www-form-urlencoded',
      body: cleanObject({
        id: props.id,
        first_name: props.first_name,
        last_name: props.last_name,
        email: props.email,
        company: props.company,
        phone: props.phone,
        locale: props.locale,
        auto_collection: props.auto_collection,
      }),
    });
  },
});
