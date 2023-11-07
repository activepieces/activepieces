import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Subscription } from '../common/models';
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
    return await fetchForms(context.auth);
  },
});

// Clone and set required to false for custom fields property
const allFieldsRequiredRefreshers = {
  ...allFields,
  required: false,
  refreshers: ['auth, formId'],
};

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
    fields: allFieldsRequiredRefreshers,
  },
  async run(context) {
    const { formId, email, firstName, tags, fields } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${formId}/subscribe`;

    const body = {
      api_secret: context.auth,
      email,
      first_name: firstName,
      tags,
      fields,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscription: Subscription;
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error adding subscriber to form: ${response.status}`);
    }
    return response.body.subscription;
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${context.propsValue.formId}/subscriptions`;

    const body = {
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      body,
      method: HttpMethod.GET,
    };

    const response = await httpClient.sendRequest<{
      subscriptions: Subscription[];
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error listing form subscriptions: ${response.status}`);
    }

    return response.body.subscriptions;
  },
});
