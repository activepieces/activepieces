import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi } from '../common/client';
import type { GoogleAdsAuthValue, GoogleAdsRow } from '../common/client';
import { customerIdProp } from '../common/props';
import { resourceTypeProp } from '../common/records';
import { newestRecordsQuery, readField, recordsAfterIdQuery, resourceDefinition } from '../common/resources';
import type { ResourceDefinition } from '../common/resources';

export async function recordsAfter({ auth, customerId, def, afterId }: RecordsAfterParams): Promise<GoogleAdsRow[]> {
  const { results } = await GoogleAdsApi.searchAll({ auth, customerId, query: recordsAfterIdQuery({ def, afterId }), maxRows: MAX_ROWS_PER_POLL });
  return results;
}

async function saveBaseline({ auth, customerId, resourceType, store }: SaveBaselineParams): Promise<void> {
  const def = resourceDefinition(resourceType);
  const newest = await newestRecords({ auth, customerId, def, limit: 1 });
  await store.put(LAST_ID_KEY, idOf({ def, row: newest[0] }) ?? '0');
}

async function newestRecords({ auth, customerId, def, limit }: NewestRecordsParams): Promise<GoogleAdsRow[]> {
  const page = await GoogleAdsApi.search({ auth, customerId, query: newestRecordsQuery({ def, limit }) });
  return page.results ?? [];
}

function idOf({ def, row }: { def: ResourceDefinition; row: GoogleAdsRow | undefined }): string | null {
  if (row === undefined) return null;
  const id = readField({ row, gaqlPath: def.idField });
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

const LAST_ID_KEY = 'google_ads_new_record_last_id';
const MAX_ROWS_PER_POLL = 1_000;
const TEST_LIMIT = 5;

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
    await saveBaseline({ auth: context.auth, customerId: context.propsValue.customerId, resourceType: context.propsValue.resourceType, store: context.store });
  },
  async onDisable(context) {
    await context.store.delete(LAST_ID_KEY);
  },
  async run(context) {
    const lastId = await context.store.get<string>(LAST_ID_KEY);
    if (lastId === null || lastId === undefined) {
      await saveBaseline({ auth: context.auth, customerId: context.propsValue.customerId, resourceType: context.propsValue.resourceType, store: context.store });
      return [];
    }
    const def = resourceDefinition(context.propsValue.resourceType);
    const rows = await recordsAfter({ auth: context.auth, customerId: context.propsValue.customerId, def, afterId: lastId });
    const newestId = idOf({ def, row: rows[rows.length - 1] });
    if (newestId !== null) {
      await context.store.put(LAST_ID_KEY, newestId);
    }
    return rows;
  },
  async test(context) {
    const def = resourceDefinition(context.propsValue.resourceType);
    return newestRecords({ auth: context.auth, customerId: context.propsValue.customerId, def, limit: TEST_LIMIT });
  },
});

type RecordsAfterParams = { auth: GoogleAdsAuthValue; customerId: string; def: ResourceDefinition; afterId: string };

type NewestRecordsParams = { auth: GoogleAdsAuthValue; customerId: string; def: ResourceDefinition; limit: number };

type SaveBaselineParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  resourceType: string;
  store: { put: <T>(key: string, value: T) => Promise<T> };
};
