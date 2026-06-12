import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { readwiseAuth } from '../common/auth';
import {
  makeReadwiseRequest,
  ReadwiseHighlight,
  ReadwisePaginatedResponse,
} from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof readwiseAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const params: Record<string, string> = { page_size: '1000' };
    if (lastFetchEpochMS) {
      params['updated__gt'] = new Date(lastFetchEpochMS).toISOString();
    }
    const response = await makeReadwiseRequest<
      ReadwisePaginatedResponse<ReadwiseHighlight>
    >({
      token: auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/highlights/',
      params,
    });
    return response.results.map((highlight) => ({
      epochMilliSeconds: new Date(highlight.created_at).getTime(),
      data: highlight,
    }));
  },
};

export const newHighlight = createTrigger({
  name: 'new_highlight',
  displayName: 'New Highlight',
  description: 'Fires when a new highlight is saved to Readwise.',
  aiMetadata: {
    description:
      'Fires when a new highlight is created in the connected Readwise account, emitting that highlight. Polls Readwise on an interval and surfaces each newly added highlight as a separate event.',
  },
  auth: readwiseAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 12345678,
    text: 'The best investment you can make is in yourself.',
    note: '',
    location: 1,
    location_type: 'order',
    color: 'yellow',
    highlighted_at: '2026-04-17T00:00:00.000Z',
    created_at: '2026-04-17T00:00:00.000Z',
    updated: '2026-04-17T00:00:00.000Z',
    external_id: null,
    end_location: null,
    url: null,
    book_id: 9876543,
    tags: [],
    readwise_url: 'https://readwise.io/open/12345678',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
