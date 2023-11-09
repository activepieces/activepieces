import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  fetchTags,
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
import { Tag } from '../common/models';
import { subscriberId } from '../common/subscribers';
import { allFields } from '../common/custom-fields';
import { CONVERTKIT_API_URL } from '../common/constants';

export const listTags = createAction({
  auth: convertkitAuth,
  name: 'tags_list_tags',
  displayName: 'Tags: List Tags',
  description: 'Returns a list of all tags',
  props: {},
  run(context) {
    return fetchTags(context.auth);
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/`;

    const body = {
      api_secret: context.auth,
      tag: { name: context.propsValue.name },
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{ tag: Tag }>(request);

    if (response.status !== 201) {
      throw new Error(`Error creating tag: ${response.status}`);
    }

    return response.body;
  },
});

const tagsRequired = { ...tags, required: true };

// TODO:
// fields do not show up in the UI
// Sometimes the Tags dropdown will show an error instead of a tag list. Clicking to another piece (Cradete Tag) and then back to this one will fix it.
export const tagSubscriber = createAction({
  auth: convertkitAuth,
  name: 'tags_tag_subscriber',
  displayName: 'Tags: Tag Subscriber',
  description: 'Tag a subscriber',
  props: {
    email,
    // tagId: tag,
    firstName,
    tags: tagsRequired,
    fields: allFields,
  },
  async run(context) {
    const { email, firstName, tags, fields } = context.propsValue;
    const tagId = tags![0];

    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${tagId}/subscribe`;

    const body = {
      email,
      first_name: firstName,
      tags,
      fields,
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscription: Tag;
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error tagging subscriber: ${response.status}`);
    }

    return response.body.subscription;
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

    const body = {
      email,
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{ subscriber: Tag }>(request);

    if (response.status !== 200) {
      throw new Error(`Error removing tag from subscriber: ${response.status}`);
    }

    return response.body;
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

    const body = {
      id: subscriberId,
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{ subscriber: Tag }>(request);

    if (response.status !== 200) {
      throw new Error(`Error removing tag from subscriber: ${response.status}`);
    }

    return response.body;
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${tagId}/subscriptions?`;

    const body = {
      api_secret: context.auth,
      page,
      sort_order: sortOrder,
      subscriber_state: subscriberState,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscriptions: Tag[];
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error listing subscriptions to tag: ${response.status}`);
    }

    return response.body.subscriptions;
  },
});
