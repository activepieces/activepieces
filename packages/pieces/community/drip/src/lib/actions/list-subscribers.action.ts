import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listSubscribersAction = createAction({
  auth: dripAuth,
  name: 'list_subscribers',
  displayName: 'List Subscribers',
  description: 'Lists subscribers one page at a time, optionally filtered by status, tags or sign-up date.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists subscribers of a Drip account one page at a time, optionally only those with at least one of the given tags, a status (active by default, unsubscribed, undeliverable or all) or created within a date range. Use to find contacts in a segment; pass the next page number while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Which subscribers to return. Drip defaults to Active.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Active or unsubscribed', value: 'active_or_unsubscribed' },
          { label: 'Undeliverable', value: 'undeliverable' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    tags: dripProps.tags({ displayName: 'Has Any of These Tags', description: 'Only return subscribers with at least one of these tags.' }),
    subscribedAfter: Property.DateTime({ displayName: 'Created After', description: 'Only subscribers created after this date-time (ISO-8601).', required: false }),
    subscribedBefore: Property.DateTime({ displayName: 'Created Before', description: 'Only subscribers created before this date-time (ISO-8601).', required: false }),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.subscriberPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const subscribedAfter = dripApi.parseIsoDate({ value: propsValue.subscribedAfter, label: 'Created After' });
    const subscribedBefore = dripApi.parseIsoDate({ value: propsValue.subscribedBefore, label: 'Created Before' });
    const tags = dripApi.textList(propsValue.tags);
    if (tags?.some((tag) => tag.includes(','))) {
      throw new Error('Tag filters cannot contain commas: Drip reads this filter as a comma-separated list.');
    }
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: '/subscribers',
      key: 'subscribers',
      operation: 'list subscribers',
      page,
      perPage,
      query: {
        status: propsValue.status,
        tags: tags && tags.length > 0 ? tags.join(',') : undefined,
        subscribed_after: subscribedAfter,
        subscribed_before: subscribedBefore,
      },
    });
  },
});
