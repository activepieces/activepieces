import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';

const API_ENDPOINT = 'forms/';

export const listForms = createAction({
  auth: convertkitAuth,
  name: 'list_forms',
  displayName: 'Forms: List Forms',
  description: 'Returns a list of all forms',
  props: {},
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const addSubscriberToForm = createAction({
  auth: convertkitAuth,
  name: 'add_subscriber_to_form',
  displayName: 'Forms: Add Subscriber To Form',
  description: 'Add a subscriber to a form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form Id',
      description: 'The form id',
      required: true,
    }),
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
    fields: Property.Array({
      displayName: 'Fields',
      description: 'The custom fields',
      required: false,
    }),
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${context.propsValue.formId}/subscribe?api_secret=${context.auth}`;

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
  name: 'list_form_subscriptions',
  displayName: 'Forms: List Form Subscriptions',
  description: 'List form subscriptions',
  props: {
    formId: Property.ShortText({
      displayName: 'Form Id',
      description: 'The form id',
      required: true,
    }),
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${context.propsValue.formId}/subscriptions?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
