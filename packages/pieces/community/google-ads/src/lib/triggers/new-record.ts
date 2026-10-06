import { DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import type { Polling } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi } from '../common/client';
import { customerIdProp } from '../common/props';
import { resourceTypeProp } from '../common/records';
import { newestRecordsQuery, readField, resourceDefinition } from '../common/resources';

export const polling: Polling<AppConnectionValueForAuthProperty<typeof googleAdsAuth>, NewRecordProps> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const def = resourceDefinition(propsValue.resourceType);
    const page = await GoogleAdsApi.search({ auth, customerId: propsValue.customerId, query: newestRecordsQuery({ def }) });
    return (page.results ?? []).map((row) => ({
      id: String(readField({ row, gaqlPath: def.idField }) ?? ''),
      data: row,
    }));
  },
};

export const newRecord = createTrigger({
  name: 'newRecord',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Fires when a campaign, ad group, ad, keyword or audience list is created in the selected account (removed records are ignored)',
  aiMetadata: {
    description:
      'Fires once per newly created record of the chosen type (campaign, ad group, ad, keyword or audience list) in one Google Ads account, detected by polling for ids above the last one seen. Each payload is one GAQL row nested under the resource (for example campaign.id); removed records and updates do not fire.',
  },
  auth: googleAdsAuth,
  props: {
    customerId: customerIdProp,
    resourceType: resourceTypeProp,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    campaign: {
      resourceName: 'customers/1234567890/campaigns/123456789',
      id: '123456789',
      name: 'Spring sale',
      status: 'ENABLED',
      advertisingChannelType: 'SEARCH',
      biddingStrategyType: 'MANUAL_CPC',
      campaignBudget: 'customers/1234567890/campaignBudgets/1122334455',
      startDateTime: '2026-09-01 00:00:00',
      endDateTime: '2037-12-30 23:59:59',
    },
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
  async test(context) {
    return pollingHelper.test(polling, context);
  },
});

type NewRecordProps = { customerId: string; resourceType: string };
