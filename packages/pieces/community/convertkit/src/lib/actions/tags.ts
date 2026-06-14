import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { convertkitAuth } from '../..';
import {
  tag,
  tagsRequired,
  name,
  tagIdByEmail,
  tagIdBySubscriberId,
  tagsPageNumber,
  sortOrder,
  subscriberState,
} from '../common/tags';
import {
  subscriberId,
  subscriberEmail,
  subscriberFirstName,
} from '../common/subscribers';
import { Tag } from '../common/types';
import { allFields } from '../common/custom-fields';
import { TAGS_API_ENDPOINT } from '../common/constants';
import { fetchTags } from '../common/service';

export const listTags = createAction({
  auth: convertkitAuth,
  name: 'tags_list_tags',
  displayName: 'List Tags',
  description: 'Returns a list of all tags',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every tag in the account with its ID and name. Use it to find a tag ID before tagging or untagging subscribers, or before listing a tag\'s subscriptions. Takes no inputs; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  run(context) {
    return fetchTags(context.auth.secret_text);
  },
});

export const createTag = createAction({
  auth: convertkitAuth,
  name: 'tags_create_tag',
  displayName: 'Create Tag',
  description: 'Create a tag',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new tag with the given name. Not idempotent — calling it again can create a duplicate, so check List Tags for an existing tag first.',
    idempotent: false,
  },
  props: {
    name,
  },
  async run(context) {
    const url = TAGS_API_ENDPOINT;

    const body = {
      api_secret: context.auth.secret_text,
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

// TODO:
// fields do not show up in the UI
// Sometimes the Tags dropdown will show an error instead of a tag list. Clicking to another piece (Cradete Tag) and then back to this one will fix it.
export const tagSubscriber = createAction({
  auth: convertkitAuth,
  name: 'tags_tag_subscriber',
  displayName: 'Tag Subscriber',
  description: 'Tag a subscriber',
  audience: 'both',
  aiMetadata: {
    description:
      'Applies one or more existing tags to a subscriber by email address (subscribing the email to the first tag and attaching the rest), optionally setting first name and custom fields; at least one tag is required. Effectively idempotent — re-applying the same tags converges to the same state.',
    idempotent: true,
  },
  props: {
    email: subscriberEmail,
    // tagId: tag,
    firstName: subscriberFirstName,
    tags: tagsRequired,
    fields: allFields,
  },
  async run(context) {
    const { email, firstName, tags, fields } = context.propsValue;
    if (!tags || tags.length === 0) {
      throw new Error('At least one tag is required');
    }
    const tagId = tags[0];

    const url = `${TAGS_API_ENDPOINT}/${tagId}/subscribe`;

    const body = {
      email,
      first_name: firstName,
      tags,
      fields,
      api_secret: context.auth.secret_text,
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
  displayName: 'Remove Tag From Subscriber By Email',
  description: 'Remove a tag from a subscriber by email',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a single tag from a subscriber identified by email address. Use the By Id variant when the numeric subscriber ID is already known. Treated as non-idempotent — a retry may error once the tag is already removed, though the end state is the same.',
    idempotent: false,
  },
  props: {
    email: subscriberEmail,
    tagId: tagIdByEmail,
  },
  async run(context) {
    const { email, tagId } = context.propsValue;
    const url = `${TAGS_API_ENDPOINT}/${tagId}/unsubscribe`;

    const body = {
      email,
      api_secret: context.auth.secret_text,
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
  displayName: 'Remove Tag From Subscriber By Id',
  description: 'Remove a tag from a subscriber by id',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a single tag from a subscriber identified by numeric subscriber ID. Use the By Email variant when only an address is known. Treated as non-idempotent — a retry may error once the tag is already removed.',
    idempotent: false,
  },
  props: {
    subscriberId,
    tagId: tagIdBySubscriberId,
  },
  async run(context) {
    const { subscriberId, tagId } = context.propsValue;
    const url = `${TAGS_API_ENDPOINT}/${tagId}/unsubscribe`;

    const body = {
      id: subscriberId,
      api_secret: context.auth.secret_text,
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
  displayName: 'List Subscriptions To Tag',
  description: 'List all subscriptions to a tag',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the subscribers subscribed to a specific tag, with paging, sort order, and subscriber-state filtering. Use List Tags first to find the tag ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    tagId: tag,
    page: tagsPageNumber,
    sortOrder,
    subscriberState,
  },
  async run(context) {
    const { tagId, page, sortOrder, subscriberState } = context.propsValue;
    const url = `${TAGS_API_ENDPOINT}/${tagId}/subscriptions?`;

    const body = {
      api_secret: context.auth.secret_text,
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
