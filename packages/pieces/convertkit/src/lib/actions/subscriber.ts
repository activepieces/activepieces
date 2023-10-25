import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { subscriberId } from '../common';
import { CONVERTKIT_API_URL } from '../common';

export const API_ENDPOINT = 'subscribers/';

export const getSubscriberById = createAction({
  auth: convertkitAuth,
  name: 'get_subscriber_by_id',
  displayName: 'Get Subscriber By Id',
  description: 'Returns data for a single subscriber',
  props: {
    subscriberId,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${subscriberId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const listSubscribers = createAction({
  auth: convertkitAuth,
  name: 'list_subscribers',
  displayName: 'List Subscribers',
  description: 'Returns a list of all subscribers',
  props: {
    page: Property.Number({
      displayName: 'Number of pages.',
      description: 'Return 50 entries each page.',
      required: false,
    }),
    from: Property.DateTime({
      displayName: 'From',
      description: 'Return subscribers created after this date',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To',
      description: 'Return subscribers created before this date',
      required: false,
    }),
    updated_from: Property.DateTime({
      displayName: 'Updated From',
      description: 'Return subscribers updated after this date',
      required: false,
    }),
    updated_to: Property.DateTime({
      displayName: 'Updated To',
      description: 'Return subscribers updated before this date',
      required: false,
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order',
      required: false,
      options: {
        options: [
          { value: 'asc', label: 'Ascending' },
          { value: 'desc', label: 'Descending' },
        ],
      },
    }),
    sort_field: Property.ShortText({
      displayName: 'Sort Field',
      description: 'Sort field',
      required: false,
    }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address',
      required: false,
    }),
  },
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

export const updateSubscriber = createAction({
  auth: convertkitAuth,
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update a subscriber',
  props: {
    subscriberId,
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name',
      required: false,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Custom fields',
      required: false,
    }),
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${subscriberId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(context.propsValue),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body x
    const data = await response.json();

    // Return response body
    return data;
  },
});
