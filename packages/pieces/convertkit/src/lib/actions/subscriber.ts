import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { subscriberId, CONVERTKIT_API_URL } from '../common';
import { propertyCustomFields } from './custom-fields';

const API_ENDPOINT = 'subscribers';

export const fetchSubscriberByEmail = async (
  auth: string,
  email_address: string
) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${auth}&email_address=${email_address}`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const data = await response.json();

  return data;
};

export const getSubscribedTags = async (auth: string, subscriberId: string) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${subscriberId}/tags?api_secret=${auth}`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return await response.json();
};

export const getSubscriberById = createAction({
  auth: convertkitAuth,
  name: 'subscribers_get_subscriber_by_id',
  displayName: 'Subscriber: Get Subscriber By Id',
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

export const getSubscriberByEmail = createAction({
  auth: convertkitAuth,
  name: 'subscribers_get_subscriber_by_email',
  displayName: 'Subscriber: Get Subscriber By Email',
  description: 'Returns data for a single subscriber',
  props: {
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address',
      required: true,
    }),
  },
  async run(context) {
    const { email_address } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}&email_address=${email_address}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return { subscriber: data['subscribers'][0] };
  },
});

export const listSubscribers = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_subscribers',
  displayName: 'Subscriber: List Subscribers',
  description: 'Returns a list of all subscribers',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description:
        'Page number. Each page of results will contain up to 50 subscribers.',
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
    let props = {};
    if (context.propsValue.page) {
      props = { ...props, page: context.propsValue.page };
    }
    if (context.propsValue.from) {
      props = { ...props, from: context.propsValue.from };
    }
    if (context.propsValue.to) {
      props = { ...props, to: context.propsValue.to };
    }
    if (context.propsValue.updated_from) {
      props = { ...props, updated_from: context.propsValue.updated_from };
    }
    if (context.propsValue.updated_to) {
      props = { ...props, updated_to: context.propsValue.updated_to };
    }
    if (context.propsValue.sort_order) {
      props = { ...props, sort_order: context.propsValue.sort_order };
    }
    if (context.propsValue.sort_field) {
      props = { ...props, sort_field: context.propsValue.sort_field };
    }
    if (context.propsValue.email_address) {
      props = { ...props, email_address: context.propsValue.email_address };
    }

    // build the url
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${
      context.auth
    }&${new URLSearchParams(props).toString()}`;

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
  name: 'subscribers_update_subscriber',
  displayName: 'Subscriber: Update Subscriber',
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
    fields: propertyCustomFields,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${subscriberId}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({ ...context.propsValue, api_secret: context.auth }),
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

export const unsubscribeSubscriber = createAction({
  auth: convertkitAuth,
  name: 'subscribers_unsubscribe_subscriber',
  displayName: 'Subscriber: Unsubscribe Subscriber',
  description: 'Unsubscribe a subscriber',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    const subscriberId = await fetchSubscriberByEmail(context.auth, email);
    const url = `${CONVERTKIT_API_URL}unsubscribe`;

    const body = JSON.stringify({ email, api_secret: context.auth }, null, 2);

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body,
      // body: JSON.stringify({ ...context.propsValue, api_secret: context.auth }),
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

export const listSubscriberTags = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_tags',
  displayName: 'Subscriber: List Tags',
  description: 'Returns a list of all subscribed tags',
  props: {
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address',
      required: true,
    }),
  },
  async run(context) {
    const { email_address } = context.propsValue;
    const subscriberId = await fetchSubscriberByEmail(
      context.auth,
      email_address
    );
    return await getSubscribedTags(context.auth, subscriberId);
  },
});
