import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { buttondownAuth } from '../common/auth';
import { buttondownRequest, ButtondownPagedResponse } from '../common/client';
import {
  subscriberTypeOptions,
  subscriberSourceOptions,
  subscriberOrderingOptions,
} from '../common/options';
import { ButtondownSubscriber } from '../common/types';

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
        options: subscriberSourceOptions,
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
        options: subscriberOrderingOptions,
      },
    }),
  },
  async run({ auth, propsValue }) {
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
