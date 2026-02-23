import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { buttondownAuth } from '../common/auth';
import { buttondownRequest, ButtondownPagedResponse } from '../common/client';
import {
  ButtondownSubscriber,
  ButtondownSubscriberSource,
  ButtondownSubscriberType,
} from '../common/types';

const subscriberSources: { label: string; value: ButtondownSubscriberSource }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'API', value: 'api' },
  { label: 'Carrd', value: 'carrd' },
  { label: 'Comment', value: 'comment' },
  { label: 'Embedded form', value: 'embedded_form' },
  { label: 'Hosted form', value: 'form' },
  { label: 'Import', value: 'import' },
  { label: 'Memberful', value: 'memberful' },
  { label: 'Organic', value: 'organic' },
  { label: 'Patreon', value: 'patreon' },
  { label: 'Stripe', value: 'stripe' },
  { label: 'User portal', value: 'user' },
  { label: 'Zapier', value: 'zapier' },
];

const orderingOptions = [
  { label: 'Newest first', value: '-creation_date' },
  { label: 'Oldest first', value: 'creation_date' },
  { label: 'Email address (A→Z)', value: 'email_address' },
  { label: 'Email address (Z→A)', value: '-email_address' },
  { label: 'Last opened (recent first)', value: '-last_open_date' },
  { label: 'Last opened (oldest first)', value: 'last_open_date' },
];

const subscriberTypeOptions: { label: string; value: ButtondownSubscriberType }[] = [
  { label: 'Regular', value: 'regular' },
  { label: 'Premium', value: 'premium' },
  { label: 'Unactivated', value: 'unactivated' },
  { label: 'Paused', value: 'paused' },
  { label: 'Trialed', value: 'trialed' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Churning', value: 'churning' },
  { label: 'Churned', value: 'churned' },
  { label: 'Unsubscribed', value: 'unsubscribed' },
  { label: 'Undeliverable', value: 'undeliverable' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Complained', value: 'complained' },
  { label: 'Gifted', value: 'gifted' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Removed', value: 'removed' },
  { label: 'Unpaid', value: 'unpaid' },
];

export const listSubscribers = createAction({
  auth: buttondownAuth,
  name: 'listSubscribers',
  displayName: 'List Subscribers',
  description: 'Retrieve subscribers from Buttondown.',
  props: {
    limit: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of subscribers to return (1-1000).',
      required: false,
      defaultValue: 100,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'Provide the cursor value from a previous response to fetch the next page.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Subscriber Type',
      required: false,
      options: {
        options: subscriberTypeOptions,
      },
    }),
    source: Property.StaticDropdown({
      displayName: 'Source',
      required: false,
      options: {
        options: subscriberSources,
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Filter by subscribers who have at least one of these tags.',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        }),
      },
    }),
    emailAddress: Property.ShortText({
      displayName: 'Email Contains',
      description: 'Return subscribers whose email address contains this value.',
      required: false,
    }),
    referrerUrl: Property.ShortText({
      displayName: 'Referrer URL Contains',
      required: false,
    }),
    ordering: Property.StaticDropdown({
      displayName: 'Ordering',
      required: false,
      options: {
        options: orderingOptions,
      },
    }),
  },
  async run({ auth, propsValue }) {
    if (!auth?.secret_text) {
      throw new Error('Authentication is required. Connect your Buttondown account.');
    }

    const query: Record<string, string | number | boolean | (string | number | boolean)[] | undefined> = {};

    if (propsValue.limit) {
      query['page_size'] = propsValue.limit;
    }

    if (propsValue.cursor) {
      query['cursor'] = propsValue.cursor;
    }

    if (propsValue.type) {
      query['type'] = [propsValue.type];
    }

    if (propsValue.source) {
      query['source'] = [propsValue.source];
    }

    const tags = (propsValue.tags as Array<{ tag?: string }> | undefined)
      ?.map((entry) => entry.tag?.trim())
      .filter((tag): tag is string => !!tag);
    if (tags && tags.length > 0) {
      query['tag'] = tags;
    }

    if (propsValue.emailAddress) {
      query['email_address'] = propsValue.emailAddress;
    }

    if (propsValue.referrerUrl) {
      query['referrer_url'] = propsValue.referrerUrl;
    }

    if (propsValue.ordering) {
      query['ordering'] = propsValue.ordering;
    }

    const response = await buttondownRequest<ButtondownPagedResponse<ButtondownSubscriber>>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/subscribers',
      query,
    });

    return response;
  },
});
