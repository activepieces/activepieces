import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { sellToStateAuth } from '../common/auth';
import { SearchResult, stsGet } from '../common/client';

type Props = { q?: string; country?: string; openOnly?: boolean };

// sort=added_desc returns the newest rows in Sell to State first, so the last
// seen slug marks where the previous poll stopped.
const polling: Polling<AppConnectionValueForAuthProperty<typeof sellToStateAuth>, Props> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const result = await stsGet<SearchResult>({
      apiKey: auth.secret_text,
      path: '/search',
      query: {
        scope: 'tenders',
        q: propsValue.q,
        country: propsValue.country,
        lifecycle: propsValue.openOnly === false ? undefined : 'open',
        sort: 'added_desc',
        per_page: 50,
      },
    });
    return result.hits.map((hit) => ({ id: hit.slug, data: hit }));
  },
};

export const newTender = createTrigger({
  auth: sellToStateAuth,
  name: 'new_tender',
  displayName: 'New Tender',
  description: 'Triggers when Sell to State adds a tender that matches your search.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires for each tender that Sell to State adds and that matches the text, the countries and the open-only filter.',
  },
  props: {
    q: Property.ShortText({
      displayName: 'Text',
      description: 'Words in the tender title. Empty matches every tender.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country slug, or slugs separated by commas. Empty means all countries.',
      required: false,
    }),
    openOnly: Property.Checkbox({
      displayName: 'Open Tenders Only',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    title: 'CA18471 - Lionheart Educational Trust - HR & Payroll Software and Managed Payroll Services',
    kind: 'tender',
    slug: '103693089',
    sub: 'Lionheart Educational Trust · —',
    country: 'united-kingdom',
    year: 2026,
    lifecycle: 'open',
    deadline_at: '2026-10-26T10:00:00.000Z',
    accepts_bids: true,
    source_url: 'https://www.contractsfinder.service.gov.uk/Notice/25ca0d93-b1f4-420e-8355-c4882a6ffc35',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
