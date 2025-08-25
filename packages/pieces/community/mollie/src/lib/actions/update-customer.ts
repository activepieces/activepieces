import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieCustomer } from '../common';

export const mollieUpdateCustomer = createAction({
  auth: mollieAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Update an existing customer',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The customer name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The customer email address',
      required: false,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'The customer locale',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en_US' },
          { label: 'Dutch', value: 'nl_NL' },
          { label: 'Dutch (Belgium)', value: 'nl_BE' },
          { label: 'French', value: 'fr_FR' },
          { label: 'French (Belgium)', value: 'fr_BE' },
          { label: 'German', value: 'de_DE' },
          { label: 'German (Austria)', value: 'de_AT' },
          { label: 'German (Switzerland)', value: 'de_CH' },
          { label: 'Spanish', value: 'es_ES' },
          { label: 'Italian', value: 'it_IT' },
          { label: 'Portuguese', value: 'pt_PT' },
          { label: 'Swedish', value: 'sv_SE' },
          { label: 'Finnish', value: 'fi_FI' },
          { label: 'Danish', value: 'da_DK' },
          { label: 'Norwegian', value: 'nb_NO' },
          { label: 'Polish', value: 'pl_PL' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata to attach to the customer',
      required: false,
    }),
  },
  async run(context) {
    const updateData: any = {};

    if (context.propsValue.name) {
      updateData.name = context.propsValue.name;
    }

    if (context.propsValue.email) {
      updateData.email = context.propsValue.email;
    }

    if (context.propsValue.locale) {
      updateData.locale = context.propsValue.locale;
    }

    if (context.propsValue.metadata) {
      updateData.metadata = context.propsValue.metadata;
    }

    const customer = await mollieCommon.updateResource<MollieCustomer>(
      context.auth,
      'customers',
      context.propsValue.customerId,
      updateData
    );

    return customer;
  },
});