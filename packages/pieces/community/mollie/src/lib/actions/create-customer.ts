import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mollieCommon } from '../common';
import { mollieAuth } from '../../index';

export const mollieCreateCustomer = createAction({
  auth: mollieAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in Mollie',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The full name of the customer',
      required: false,
    }),

    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the customer',
      required: false,
    }),

    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'The language to be used in the hosted payment pages',
      required: false,
      options: {
        options: [
          { label: 'English (US)', value: 'en_US' },
          { label: 'English (GB)', value: 'en_GB' },
          { label: 'Dutch (NL)', value: 'nl_NL' },
          { label: 'Dutch (BE)', value: 'nl_BE' },
          { label: 'German (DE)', value: 'de_DE' },
          { label: 'German (AT)', value: 'de_AT' },
          { label: 'German (CH)', value: 'de_CH' },
          { label: 'French (FR)', value: 'fr_FR' },
          { label: 'French (BE)', value: 'fr_BE' },
          { label: 'Spanish (ES)', value: 'es_ES' },
          { label: 'Catalan (ES)', value: 'ca_ES' },
          { label: 'Portuguese (PT)', value: 'pt_PT' },
          { label: 'Italian (IT)', value: 'it_IT' },
          { label: 'Norwegian (NO)', value: 'nb_NO' },
          { label: 'Swedish (SE)', value: 'sv_SE' },
          { label: 'Finnish (FI)', value: 'fi_FI' },
          { label: 'Danish (DK)', value: 'da_DK' },
          { label: 'Icelandic (IS)', value: 'is_IS' },
          { label: 'Hungarian (HU)', value: 'hu_HU' },
          { label: 'Polish (PL)', value: 'pl_PL' },
          { label: 'Latvian (LV)', value: 'lv_LV' },
          { label: 'Lithuanian (LT)', value: 'lt_LT' },
        ],
      },
    }),

    metadata: Property.ShortText({
      displayName: 'Metadata',
      description:
        'Additional data to save alongside the customer (JSON string)',
      required: false,
    }),

    testmode: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'Whether to create the customer in test mode',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth as string;

    const customerData: Record<string, unknown> = {};

    if (propsValue.name) {
      customerData['name'] = propsValue.name;
    }
    if (propsValue.email) {
      customerData['email'] = propsValue.email;
    }
    if (propsValue.locale) {
      customerData['locale'] = propsValue.locale;
    }
    if (propsValue.metadata) {
      try {
        customerData['metadata'] = JSON.parse(propsValue.metadata);
      } catch {
        customerData['metadata'] = propsValue.metadata;
      }
    }

    const response = await mollieCommon.makeRequest(
      apiKey,
      HttpMethod.POST,
      '/customers',
      customerData,
      propsValue.testmode
    );

    return response;
  },
});
