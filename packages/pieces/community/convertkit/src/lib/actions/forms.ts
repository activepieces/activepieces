import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Subscription } from '../common/types';
import { convertkitAuth } from '../..';
import { formId } from '../common/forms';
import { subscriberEmail, subscriberFirstName } from '../common/subscribers';
import { allFields } from '../common/custom-fields';
import { FORMS_API_ENDPOINT } from '../common/constants';
import { fetchForms } from '../common/service';
import { tags } from '../common/tags';

export const listForms = createAction({
  auth: convertkitAuth,
  name: 'forms_list_forms',
  displayName: 'List Forms',
  description: 'Returns a list of all forms',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all forms and landing pages in the account with their IDs and names. Use it to find a form ID before adding subscribers to a form or listing form subscriptions. Takes no inputs; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  run(context) {  
    return fetchForms(context.auth.secret_text);
  },
});

// Clone and set required to false for custom fields property
const allFieldsRequiredRefreshers = {
  ...allFields,
  required: false,
  refreshers: ['auth', 'formId'],
};

export const addSubscriberToForm = createAction({
  auth: convertkitAuth,
  name: 'forms_add_subscriber_to_form',
  displayName: 'Add Subscriber To Form',
  description: 'Add a subscriber to a form',
  audience: 'both',
  aiMetadata: {
    description:
      'Subscribes an email address to a specific form, optionally setting first name, tags, and custom field values. This is the standard way to add a new subscriber in ConvertKit. Effectively idempotent — re-subscribing the same email to the same form upserts rather than creating a duplicate.',
    idempotent: true,
  },
  props: {
    formId,
    email: subscriberEmail,
    firstName: subscriberFirstName,
    tags,
    fields: allFieldsRequiredRefreshers,
  },
  async run(context) {
    const { formId, email, firstName, tags, fields } = context.propsValue;

    const url = `${FORMS_API_ENDPOINT}/${formId}/subscribe`;

    const body = {
      api_secret: context.auth.secret_text,
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
  displayName: 'List Form Subscriptions',
  description: 'List form subscriptions',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the subscriptions for one form by form ID, one entry per subscriber who signed up through it. Use it to audit who joined via a given form. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    formId,
  },
  async run(context) {
    const url = `${FORMS_API_ENDPOINT}/${context.propsValue.formId}/subscriptions`;

    const body = {
      api_secret: context.auth.secret_text,
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
