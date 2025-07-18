import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { pinterestApiCall } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof pinterestAuth>, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const response = await pinterestApiCall({
      auth,
      method: HttpMethod.GET,
      url: '/boards',
    }) as { body: { items?: any[] } };

    const boards = response.body.items ?? [];

    return boards
      .map((board: any) => {
        const createdTime = new Date(board.created_at).getTime() || Date.now();
        return {
          epochMilliSeconds: createdTime,
          data: board,
        };
      })
      .filter((entry) => entry.epochMilliSeconds > lastFetchEpochMS);
  },
};

export const newBoardCreatedTrigger = createTrigger({
  auth: pinterestAuth,
  name: 'new_board_created',
  displayName: 'New Board',
  description: 'Triggers when a new board is created in the account.',
  props: {},
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: '549755885175',
    name: 'My New Board',
    description: 'This is a sample board.',
    privacy: 'PUBLIC',
    created_at: '2025-07-11T10:00:00Z',
    pin_count: 0,
  },
});
