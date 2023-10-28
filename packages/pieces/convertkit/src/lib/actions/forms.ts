import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';
import { propertyCustomFields} from './custom-fields';
import { propertyTags } from './tags';

const API_ENDPOINT = 'forms';

export const getForms = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${auth}`;
  const response = await fetch(url);
  return await response.json();
}


const formId = Property.Dropdown({
  displayName: 'Form',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const forms = await getForms(auth.toString());

    // loop through data and map to options
    const options = forms.forms.map(
      (field: { id: string; name: string; }) => {
        return {
          label: field.name,
          value: field.id,
        };
      }
    );

    return {
      options,
    };
  },
});

export const listForms = createAction({
  auth: convertkitAuth,
  name: 'forms_list_forms',
  displayName: 'Forms: List Forms',
  description: 'Returns a list of all forms',
  props: {},
  async run(context) {
    return getForms(context.auth);
  },
});

export const addSubscriberToForm = createAction({
  auth: convertkitAuth,
  name: 'forms_add_subscriber_to_form',
  displayName: 'Forms: Add Subscriber To Form',
  description: 'Add a subscriber to a form',
  props: {
    formId,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the subscriber',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the subscriber',
      required: false,
    }),
    tags: propertyTags,
    fields: propertyCustomFields,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${context.propsValue.formId}/subscribe?api_secret=${context.auth}`;

    console.debug('context.propsValue: ', context.propsValue);

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ...context.propsValue }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const listFormSubscriptions = createAction({
  auth: convertkitAuth,
  name: 'forms_list_form_subscriptions',
  displayName: 'Forms: List Form Subscriptions',
  description: 'List form subscriptions',
  props: {
    formId,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${context.propsValue.formId}/subscriptions?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
