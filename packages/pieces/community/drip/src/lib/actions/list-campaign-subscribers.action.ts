import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listCampaignSubscribersAction = createAction({
  auth: dripAuth,
  name: 'list_campaign_subscribers',
  displayName: 'List Email Series Subscribers',
  description: 'Lists the subscribers of one Email Series Campaign one page at a time.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the subscribers of one Drip Email Series Campaign by Campaign ID, one page at a time, filtered by subscription status (active by default, unsubscribed or removed). Pass the next page while hasMore is true. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    campaignId: Property.ShortText({ displayName: 'Campaign ID', description: 'Email Series Campaign ID (digits, from List Email Series).', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Subscription Status',
      description: 'Defaults to active.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Removed', value: 'removed' },
        ],
      },
    }),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.subscriberPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const campaignId = dripApi.parseNumericId({ value: propsValue.campaignId, label: 'Campaign ID' });
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: `/campaigns/${campaignId}/subscribers`,
      key: 'subscribers',
      operation: 'list email series subscribers',
      page,
      perPage,
      query: { status: propsValue.status },
    });
  },
});
