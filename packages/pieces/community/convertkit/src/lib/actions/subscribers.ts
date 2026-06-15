import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Subscriber } from '../common/types';
import { convertkitAuth } from '../..';
import {
  subscriberId,
  subscriberEmail,
  subscriberEmailOptional,
  subscribersPageNumber,
  subscriberFirstName,
  from,
  to,
  updatedFrom,
  updatedTo,
  sortOrder,
  sortField,
} from '../common/subscribers';
import { allFields } from '../common/custom-fields';
import {
  SUBSCRIBERS_API_ENDPOINT,
  CONVERTKIT_API_URL,
} from '../common/constants';
import {
  fetchSubscriperById,
  fetchSubscriberByEmail,
  fetchSubscribedTags,
} from '../common/service';

export const getSubscriberById = createAction({
  auth: convertkitAuth,
  name: 'subscribers_get_subscriber_by_id',
  displayName: 'Get Subscriber By Id',
  description: 'Returns data for a single subscriber',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one subscriber record (email, name, state, custom fields) by numeric subscriber ID. Use Get Subscriber By Email when only an address is known. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    subscriberId,
  },
  run(context) {
    const { subscriberId } = context.propsValue;
    return fetchSubscriperById(context.auth.secret_text, subscriberId);
  },
});

export const getSubscriberByEmail = createAction({
  auth: convertkitAuth,
  name: 'subscribers_get_subscriber_by_email',
  displayName: 'Get Subscriber By Email',
  description: 'Returns data for a single subscriber',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single subscriber by email address and returns the full record including the numeric subscriber ID. Prefer this over Get Subscriber By Id when the ID is unknown. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email_address: subscriberEmail,
  },
  async run(context) {
    const { email_address } = context.propsValue;
    return fetchSubscriberByEmail(context.auth.secret_text, email_address);
  },
});

export const listSubscribers = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_subscribers',
  displayName: 'List Subscribers',
  description: 'Returns a list of all subscribers',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists subscribers with optional filters (created/updated date ranges, email address), paging, and sorting. Use it for bulk audits or fuzzy searches; for one known subscriber prefer the Get Subscriber actions. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: subscribersPageNumber,
    sortOrder,
    sortField,
    from,
    to,
    updatedFrom,
    updatedTo,
    emailAddress: subscriberEmail,
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

    const url = SUBSCRIBERS_API_ENDPOINT;

    const body = {
      api_secret: context.auth.secret_text,
      page,
      from,
      to,
      updated_from: updatedFrom,
      updated_to: updatedTo,
      email_address: emailAddress,
      sort_order: sortOrder,
      sort_field: sortField,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscribers: Subscriber[];
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error fetching subscribers: ${response.status}`);
    }

    return response.body.subscribers;
  },
});

export const updateSubscriber = createAction({
  auth: convertkitAuth,
  name: 'subscribers_update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update a subscriber',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates a subscriber email address, first name, or custom field values by numeric subscriber ID. Idempotent — repeating the same update leaves the subscriber in the same state. It cannot change subscription status; use Unsubscribe Subscriber for that.',
    idempotent: true,
  },
  props: {
    subscriberId,
    emailAddress: subscriberEmailOptional,
    firstName: subscriberFirstName,
    fields: allFields,
  },
  async run(context) {
    const { subscriberId, emailAddress, firstName, fields } =
      context.propsValue;

    const url = `${SUBSCRIBERS_API_ENDPOINT}/${subscriberId}`;
    const body = {
      api_secret: context.auth.secret_text,
      email_address: emailAddress,
      first_name: firstName,
      fields,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.PUT,
      body,
    };

    const response = await httpClient.sendRequest<{ subscriber: Subscriber }>(
      request
    );

    if (response.status !== 200) {
      throw new Error(`Error updating subscriber: ${response.status}`);
    }

    return response.body.subscriber;
  },
});

export const unsubscribeSubscriber = createAction({
  auth: convertkitAuth,
  name: 'subscribers_unsubscribe_subscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Unsubscribe a subscriber',
  audience: 'both',
  aiMetadata: {
    description:
      'Unsubscribes the given email address from all emails in the account; this is the only removal mechanism, as there is no delete-subscriber action. Treated as non-idempotent — a retry may error once the address is already unsubscribed, though the end state is the same.',
    idempotent: false,
  },
  props: {
    email: subscriberEmail,
  },
  async run(context) {
    const { email } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/unsubscribe`;

    const body = { email, api_secret: context.auth.secret_text };

    const request: HttpRequest = {
      url,
      method: HttpMethod.PUT,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscriber: Subscriber;
    }>(request);

    if (response.status !== 200) {
      throw new Error(`Error unsubscribing subscriber: ${response.status}`);
    }

    return response.body.subscriber;
  },
});

export const listTagsBySubscriberId = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_tags_by_subscriber_id',
  displayName: 'List Tags By Subscriber Id',
  description: 'Returns a list of all subscribed tags',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all tags currently applied to a subscriber, looked up by numeric subscriber ID. Use List Tags By Email when only an address is known. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    subscriberId,
  },
  run(context) {
    const { subscriberId } = context.propsValue;
    return fetchSubscribedTags(context.auth.secret_text, subscriberId);
  },
});

export const listSubscriberTagsByEmail = createAction({
  auth: convertkitAuth,
  name: 'subscribers_list_tags_by_email',
  displayName: 'List Tags By Email',
  description: 'Returns a list of all subscribed tags',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all tags applied to a subscriber, looked up by email address (the email is resolved to a subscriber ID internally). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email_address: subscriberEmail,
  },
  async run(context) {
    const { email_address } = context.propsValue;
    const subscriberId = await fetchSubscriberByEmail(
      context.auth.secret_text,
      email_address
    );
    return fetchSubscribedTags(context.auth.secret_text, subscriberId.id);
  },
});
