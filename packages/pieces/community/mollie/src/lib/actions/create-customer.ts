import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieCustomer } from '../common';

export const mollieCreateCustomer = createAction({
  auth: mollieAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer in Mollie',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The full name of the customer',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the customer',
      required: true,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'The preferred locale of the customer',
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
    const customerData: any = {
      name: context.propsValue.name,
      email: context.propsValue.email,
    };

    if (context.propsValue.locale) {
      customerData.locale = context.propsValue.locale;
    }

    if (context.propsValue.metadata) {
      customerData.metadata = context.propsValue.metadata;
    }

    const customer = await mollieCommon.createResource<MollieCustomer>(
      context.auth,
      'customers',
      customerData
    );

    return customer;
  },
});
