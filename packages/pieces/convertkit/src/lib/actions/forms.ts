import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  formId,
  fetchForms,
  email,
  firstName,
} from '../common/forms';
import { allFields } from '../common/custom-fields';
import { CONVERTKIT_API_URL } from '../common/constants';
import { tags } from '../common/tags';

export const listForms = createAction({
  auth: convertkitAuth,
  name: 'forms_list_forms',
  displayName: 'Forms: List Forms',
  description: 'Returns a list of all forms',
  props: {},
  async run(context) {
    const data = await fetchForms(context.auth);
    // if forms exist, return forms
    if (data.forms) {
      return data.forms;
    }
    return data;
  },
});

// Clone and set required to false for custom fields property
const allFieldsForaddSubscriberToForm = { ...allFields };
allFieldsForaddSubscriberToForm.refreshers = ['auth, formId'];
allFieldsForaddSubscriberToForm.required = false;

export const addSubscriberToForm = createAction({
  auth: convertkitAuth,
  name: 'forms_add_subscriber_to_form',
  displayName: 'Forms: Add Subscriber To Form',
  description: 'Add a subscriber to a form',
  props: {
    formId,
    email,
    firstName,
    tags,
    fields: allFieldsForaddSubscriberToForm,
  },
  async run(context) {
    const { formId, email, firstName, tags, fields } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${formId}/subscribe?api_secret=${context.auth}`;

    const body = JSON.stringify({ email, first_name: firstName, tags, fields });

    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error adding subscriber to form' };
    }

    const data = await response.json();

    // If subscription is not empty, return the subscription
    if (data.subscription) {
      return data.subscription;
    } else {
      return data;
    }
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${context.propsValue.formId}/subscriptions?api_secret=${context.auth}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error listing form subscriptions' };
    }

    const data = await response.json();

    // if subscriptions is not empty, return the subscriptions
    if (data.subscriptions) {
      return data.subscriptions;
    }

    return data;
  },
});
