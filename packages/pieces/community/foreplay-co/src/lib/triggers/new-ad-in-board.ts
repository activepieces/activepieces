import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { ForeplayAuthInput, foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayPolling } from '../common/polling';
import { foreplayProps } from '../common/props';
import { legacyEventMetadata, sampleAd } from './sample-ad';

function fetcher({ auth, propsValue }: { auth: ForeplayAuthInput; propsValue: Record<string, unknown> }) {
  const boardId = foreplayProps.foreplayId({ value: propsValue['board_id'], label: 'Board' });
  const filters = foreplayProps.adFilterQuery(foreplayProps.humanAdFilterInput(propsValue));
  const pageSize = foreplayPolling.pageSizeOf(propsValue['page_size']);
  return async ({ limit, cursor }: { limit: number | undefined; cursor: string | undefined }) => {
    const size = limit ?? pageSize;
    const page = await foreplayPolling.fetchAdPage({ auth, path: '/api/board/ads', query: { board_id: boardId, ...filters, order: 'newest', limit: size, cursor }, pageSize: size });
    return { ...page, ads: page.ads.map((ad) => withBoard({ ad, boardId })) };
  };
}

function withBoard({ ad, boardId }: { ad: unknown; boardId: string }) {
  const record = foreplayMappers.recordOf(ad);
  const title = foreplayMappers.str(record['title']) ?? foreplayMappers.str(record['name']);
  return { ...record, title, board_id: boardId, metadata: legacyEventMetadata };
}

const newAdInBoard = createTrigger({
  auth: foreplayCoAuth,
  name: 'newAdInBoard',
  displayName: 'New Ad in Board',
  description: 'Triggers when a new ad shows up in the selected board.',
  aiMetadata: {
    description: 'Fires when an ad that was not there before appears among the newest ads of the selected Foreplay board, optionally narrowed by platform, format, niche, market, language and live status. Each event is one ad. Costs 1 Foreplay credit per ad checked on every poll.',
  },
  classification: 'READ',
  type: TriggerStrategy.POLLING,
  sampleData: { ...sampleAd, title: sampleAd.name, board_id: 'aBcD1234EfGh5678', metadata: legacyEventMetadata },
  outputSchema: foreplayOutputSchemas.boardAd,
  props: {
    board_id: Property.Dropdown({
      auth: foreplayCoAuth,
      displayName: 'Board',
      description: 'The board to watch.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Foreplay account first.' };
        try {
          const response = await foreplayClient.request({ auth, path: '/api/boards' });
          const boards = foreplayMappers.listOf(response.body).map(foreplayMappers.board);
          return {
            disabled: false,
            options: boards.filter((b) => b.id !== null).map((b) => ({ label: b.name ?? `Board ${b.id}`, value: b.id ?? '' })),
            placeholder: boards.length === 0 ? 'No boards found in this Foreplay account.' : undefined,
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: error instanceof Error ? error.message : 'Could not load boards.' };
        }
      },
    }),
    page_size: foreplayPolling.pageSizeProp(),
    polling_interval: foreplayPolling.legacyPollingIntervalProp(),
    ...foreplayProps.humanAdFilterProps({ withDates: false }),
  },
  async onEnable({ auth, propsValue, store, isRepublish }) {
    await foreplayPolling.seed({ store, fetchAds: fetcher({ auth, propsValue }), isRepublish });
  },
  async onDisable() {
    return;
  },
  async test({ auth, propsValue }) {
    return foreplayPolling.testAds({ fetchAds: fetcher({ auth, propsValue }) });
  },
  async run({ auth, propsValue, store }) {
    return foreplayPolling.pollNewAds({ store, fetchAds: fetcher({ auth, propsValue }) });
  },
});

export { newAdInBoard };
