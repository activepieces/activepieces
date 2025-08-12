import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createCustomerAction = createAction({
  auth: mollieAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Mollie',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Customer name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email address',
      required: true,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'Customer locale',
      required: false,
      defaultValue: 'en_US',
      options: {
        options: [
          { label: 'English (US)', value: 'en_US' },
          { label: 'Dutch', value: 'nl_NL' },
          { label: 'German', value: 'de_DE' },
          { label: 'French', value: 'fr_FR' },
        ],
      },
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Custom metadata as key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    const customerData = {
      name: context.propsValue.name,
      email: context.propsValue.email,
      locale: context.propsValue.locale,
      metadata: context.propsValue.metadata,
    };

    return await api.createCustomer(customerData);
  },
});