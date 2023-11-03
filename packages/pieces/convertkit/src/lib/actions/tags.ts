import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  tag,
  tags,
  name,
  email,
  firstName,
  tagIdByEmail,
  tagIdBySubscriberId,
  page,
  sortOrder,
  subscriberState,
} from '../common/tags';
import { subscriberId } from '../common/subscribers';
import { allFields } from '../common/custom-fields';
import { CONVERTKIT_API_URL } from '../common/constants';

export const listTags = createAction({
  auth: convertkitAuth,
  name: 'tags_list_tags',
  displayName: 'Tags: List Tags',
  description: 'Returns a list of all tags',
  props: {},
  async run(context) {
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/?api_secret=${context.auth}`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, message: 'Error fetching tags' };
    }

    const data = await response.json();

    // If tags exist, return tags
    if (data.tags) {
      return data.tags;
    }

    return data;
  },
});

export const createTag = createAction({
  auth: convertkitAuth,
  name: 'tags_create_tag',
  displayName: 'Tags: Create Tag',
  description: 'Create a tag',
  props: {
    name,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/?api_secret=${context.auth}`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ tag: context.propsValue }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error creating tag' };
    }

    const data = await response.json();

    return data;
  },
});

export const tagSubscriber = createAction({
  auth: convertkitAuth,
  name: 'tags_tag_subscriber',
  displayName: 'Tags: Tag Subscriber',
  description: 'Tag a subscriber',
  props: {
    email,
    tagId: tag,
    firstName,
    tags,
    fields: allFields,
  },
  async run(context) {
    const { email, tagId, firstName, tags, fields } = context.propsValue;

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${tagId}/subscribe`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        first_name: firstName,
        fields: fields,
        tags,
        api_secret: context.auth,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error tagging subscriber' };
    }

    const data = await response.json();

    // If subscription is not empty, return the subscription
    if (data.subscription) {
      return data.subscription;
    }

    return data;
  },
});

export const removeTagFromSubscriberByEmail = createAction({
  auth: convertkitAuth,
  name: 'tags_remove_tag_from_subscriber_by_email',
  displayName: 'Tags: Remove Tag From Subscriber By Email',
  description: 'Remove a tag from a subscriber by email',
  props: {
    email,
    tagId: tagIdByEmail,
  },
  async run(context) {
    const { email, tagId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${tagId}/unsubscribe`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        email,
        api_secret: context.auth,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error removing tag from subscriber' };
    }

    const data = await response.json();

    return data;
  },
});

export const removeTagFromSubscriberById = createAction({
  auth: convertkitAuth,
  name: 'tags_remove_tag_from_subscriber_by_id',
  displayName: 'Tags: Remove Tag From Subscriber By Id',
  description: 'Remove a tag from a subscriber by id',
  props: {
    subscriberId,
    tagId: tagIdBySubscriberId,
  },
  async run(context) {
    const { subscriberId, tagId } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${tagId}/unsubscribe`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        id: subscriberId,
        api_secret: context.auth,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error removing tag from subscriber' };
    }

    const data = await response.json();

    return data;
  },
});

export const listSubscriptionsToATag = createAction({
  auth: convertkitAuth,
  name: 'tags_list_subscriptions_to_tag',
  displayName: 'Tags: List Subscriptions To Tag',
  description: 'List all subscriptions to a tag',
  props: {
    tagId: tag,
    page,
    sortOrder,
    subscriberState,
  },
  async run(context) {
    const { tagId, page, sortOrder, subscriberState } = context.propsValue;
    // create a url parameter string
    let urlParams = `api_secret=${context.auth}`;
    if (page) {
      urlParams += `&page=${page}`;
    }
    if (sortOrder) {
      urlParams += `&sort_order=${sortOrder}`;
    }
    if (subscriberState) {
      urlParams += `&subscriber_state=${subscriberState}`;
    }
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${tagId}/subscriptions?${urlParams}`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        message: 'Error listing subscribers to tag',
      };
    }

    const data = await response.json();

    // if subscriptions is not empty, return the subscriptions
    if (data.subscriptions) {
      return data.subscriptions;
    }

    return data;
  },
});
