import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { Subscriber } from '../common/types';
import { convertkitAuth } from '../auth';
import { kitHttp } from '../common/http';
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
  buildQueryParams,
  fetchSubscriperById,
  fetchSubscriberByEmail,
  fetchSubscribedTags,
} from '../common/service';
import {
  kitSubscriberListOutputSchema,
  kitSubscriberOutputSchema,
  kitTagListOutputSchema,
} from '../output-schemas';

export const getSubscriberById = createAction({
  auth: convertkitAuth,
  name: 'subscribers_get_subscriber_by_id',
  classification: 'READ',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Get Subscriber By ID',
  description: 'Find a subscriber by their Kit ID.',
  audience: 'human',
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
  classification: 'READ',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Get Subscriber By Email',
  description: 'Find a subscriber by email address.',
  audience: 'human',
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
  classification: 'SEARCH',
  outputSchema: kitSubscriberListOutputSchema,
  displayName: 'List Subscribers',
  description: 'Get one page of subscribers, with optional filters.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists subscribers with optional filters (created/updated date ranges, email address), paging, and sorting. Use it for bulk audits or fuzzy searches; for one known subscriber prefer the Get Subscriber actions. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['emailAddress', 'from', 'to', 'updatedFrom', 'updatedTo'],
    },
  ],
  props: {
    emailAddress: subscriberEmailOptional,
    from: { ...from, width: 'half' },
    to: { ...to, width: 'half' },
    updatedFrom: { ...updatedFrom, width: 'half' },
    updatedTo: { ...updatedTo, width: 'half' },
    sortOrder: {
      ...sortOrder,
      description: 'Direction of the sort.',
    },
    sortField: {
      ...sortField,
      description: 'Field to sort by.',
      placeholder: 'id',
      advanced: true,
    },
    page: { ...subscribersPageNumber, advanced: true },
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

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
      queryParams: buildQueryParams(context.auth.secret_text, {
        page,
        from,
        to,
        updated_from: updatedFrom,
        updated_to: updatedTo,
        email_address: emailAddress,
        sort_order: sortOrder,
        sort_field: sortField,
      }),
    };

    const response = await kitHttp.sendRequest<{
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
  classification: 'WRITE',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Update Subscriber',
  description: "Change a subscriber's email, name or custom fields.",
  audience: 'human',
  aiMetadata: {
    description:
      'Updates a subscriber email address, first name, or custom field values by numeric subscriber ID. Idempotent — repeating the same update leaves the subscriber in the same state. It cannot change subscription status; use Unsubscribe Subscriber for that.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'subscriber',
      display: 'section',
      label: 'Subscriber',
      icon: 'user',
      props: ['changesInfo', 'subscriberId'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: ['emailAddress', 'firstName', 'fields'],
    },
  ],
  props: {
    changesInfo: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    subscriberId,
    emailAddress: { ...subscriberEmailOptional, width: 'half' },
    firstName: { ...subscriberFirstName, width: 'half' },
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

    const response = await kitHttp.sendRequest<{ subscriber: Subscriber }>(
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
  classification: 'DESTRUCTIVE',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Unsubscribe Subscriber',
  description: 'Unsubscribe an email address from all Kit emails.',
  audience: 'human',
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

    const response = await kitHttp.sendRequest<{
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
  classification: 'SEARCH',
  outputSchema: kitTagListOutputSchema,
  displayName: 'List Tags By Subscriber ID',
  description: 'Get the tags on a subscriber, by ID.',
  audience: 'human',
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
  classification: 'SEARCH',
  outputSchema: kitTagListOutputSchema,
  displayName: 'List Tags By Email',
  description: 'Get the tags on a subscriber, by email.',
  audience: 'human',
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
