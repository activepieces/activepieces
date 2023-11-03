import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  subscriberId,
  API_ENDPOINT,
  fetchSubscriberByEmail,
  fetchSubscribedTags,
  emailAddress,
  emailAddressRequired,
  page,
  firstName,
  from,
  to,
  updatedFrom,
  updatedTo,
  sortOrder,
  sortField,
} from '../common/subscribers';
import { allFields } from '../common/custom-fields';
import { CONVERTKIT_API_URL } from '../common/constants';

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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${subscriberId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching subscriber' };
    }

    // Get response body
    const data = await response.json();

    // return data.subscriber if it exists
    if (data.subscriber) {
      return data.subscriber;
    }

    return data;
  },
});

export const getSubscriberByEmail = createAction({
  auth: convertkitAuth,
  name: 'subscribers_get_subscriber_by_email',
  displayName: 'Subscriber: Get Subscriber By Email',
  description: 'Returns data for a single subscriber',
  props: {
    email_address: emailAddressRequired,
  },
  async run(context) {
    const { email_address } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${context.auth}&email_address=${email_address}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching subscriber' };
    }

    // Get response body
    const data = await response.json();

    if (!data.subscribers) {
      return data;
    }

    if (data.subscribers.length === 0) {
      return data;
    }

    if (data.subscribers[0]) {
      return data.subscribers[0];
    }

    return data;
  },
});

export const listSubscribers = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_subscribers',
  displayName: 'Subscriber: List Subscribers',
  description: 'Returns a list of all subscribers',
  props: {
    page,
    sortOrder,
    sortField,
    from,
    to,
    updatedFrom,
    updatedTo,
    emailAddress,
  },
  async run(context) {
    const {
      page,
      from,
      to,
      updatedFrom,
      updatedTo,
      emailAddress,
      sortOrder,
      sortField,
    } = context.propsValue;

    let props = {};
    if (page) {
      props = { ...props, page };
    }
    if (from) {
      props = { ...props, from };
    }
    if (to) {
      props = { ...props, to };
    }
    if (updatedFrom) {
      props = { ...props, updated_from: updatedFrom };
    }
    if (updatedTo) {
      props = { ...props, updated_to: updatedTo };
    }
    if (sortOrder) {
      props = { ...props, sort_order: sortOrder };
    }
    if (sortField) {
      props = { ...props, sort_field: sortField };
    }
    if (emailAddress) {
      props = { ...props, email_address: emailAddress };
    }

    // build the url
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${
      context.auth
    }&${new URLSearchParams(props).toString()}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching subscribers' };
    }

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
    emailAddress,
    firstName,
    fields: allFields,
  },
  async run(context) {
    const { subscriberId, emailAddress, firstName, fields } =
      context.propsValue;

    // const { subscriberId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${subscriberId}`;
    const body = JSON.stringify({
      api_secret: context.auth,
      email_address: emailAddress,
      first_name: firstName,
      fields,
    });

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error updating subscriber' };
    }

    // Get response body x
    const data = await response.json();

    if (data.subscriber) {
      return data.subscriber;
    }

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
    email: emailAddressRequired,
  },
  async run(context) {
    const { email } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/unsubscribe`;

    const body = JSON.stringify({ email, api_secret: context.auth });

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error unsubscribing subscriber' };
    }

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const listTagsBySubscriberId = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_tags_by_subscriber_id',
  displayName: 'Subscriber: List Tags By Subscriber Id',
  description: 'Returns a list of all subscribed tags',
  props: {
    subscriberId,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const data = await fetchSubscribedTags(context.auth, subscriberId);
    // if tags is not empty, return the tags
    if (data.tags) {
      return data.tags;
    }
    // Return response body
    return data;
  },
});

export const listSubscriberTagsByEmail = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_tags_by_email',
  displayName: 'Subscriber: List Tags By Email',
  description: 'Returns a list of all subscribed tags',
  props: {
    email_address: emailAddressRequired,
  },
  async run(context) {
    const { email_address } = context.propsValue;
    const subscriberId = await fetchSubscriberByEmail(
      context.auth,
      email_address
    );
    const data = await fetchSubscribedTags(context.auth, subscriberId);
    // if tags is not empty, return the tags
    if (data.tags) {
      return data.tags;
    }
    // Return response body
    return data;
  },
});
