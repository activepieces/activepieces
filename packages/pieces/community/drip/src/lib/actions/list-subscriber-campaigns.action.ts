import { createAction } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const listSubscriberCampaignsAction = createAction({
  auth: dripAuth,
  name: 'list_subscriber_campaigns',
  displayName: "List Subscriber's Email Series",
  description: 'Lists the Email Series Campaign subscriptions of one subscriber.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      "Lists one subscriber's Drip Email Series Campaign subscriptions (by email or subscriber ID): campaign ID, status, whether the series is complete and the last email sent. Use to check which sequences a contact is in before adding or removing them. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
    page: dripProps.page(),
    perPage: dripProps.perPage({ max: 1000 }),
  },
  outputSchema: dripOutputSchemas.campaignSubscriptionPage,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const segment = dripApi.seg({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const { page, perPage } = dripApi.paging({ page: propsValue.page, perPage: propsValue.perPage, max: 1000 });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    return dripApi.listPage({
      token,
      accountId,
      resource: `/subscribers/${segment}/campaign_subscriptions`,
      key: 'campaign_subscriptions',
      operation: 'list subscriber email series',
      page,
      perPage,
    });
  },
});
