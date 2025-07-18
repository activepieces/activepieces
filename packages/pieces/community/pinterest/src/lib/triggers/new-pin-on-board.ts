import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  QueryParams,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { boardId } from '../common/props';
import { pinterestApiCall } from '../common/client';

type Props = {
  boardId: string;
};

const polling: Polling<PiecePropValueSchema<typeof pinterestAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { boardId } = propsValue;

    let bookmark: string | undefined = undefined;
    const allPins = [];

    do {
      const queryParams: QueryParams = {
        page_size: '100',
      };
      if (bookmark) {
        queryParams['bookmark'] = bookmark;
      }

      const response = await pinterestApiCall({
        auth,
        method: HttpMethod.GET,
        url: `/boards/${boardId}/pins`,
        queryParams: queryParams,
      }) as { body: { items?: any[]; bookmark?: string } };

      const pins = response.body.items || [];

      for (const pin of pins) {
        const createdAt = new Date(pin.created_at).getTime();
        if (lastFetchEpochMS > 0 && createdAt <= lastFetchEpochMS) {
          return allPins.map((p) => ({
            epochMilliSeconds: new Date(p.created_at).getTime(),
            data: p,
          }));
        }
        allPins.push(pin);
      }

      bookmark = response.body.bookmark;
    } while (bookmark && lastFetchEpochMS === 0); // For test mode, fetch only 1 page

    return allPins.map((pin) => ({
      epochMilliSeconds: new Date(pin.created_at).getTime(),
      data: pin,
    }));
  },
};

export const newPinOnBoardTrigger = createTrigger({
  auth: pinterestAuth,
  name: 'new_pin_on_board',
  displayName: 'New Pin on Board',
  description: 'Triggers when a new Pin is added to a specific board.',
  props: {
    boardId: boardId({ displayName: 'Board', required: true }),
  },
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
    id: '813744226420795884',
    created_at: '2020-01-01T20:10:40-00:00',
    title: 'New Pin Example',
    description: 'A new pin was added to your board',
    link: 'https://www.pinterest.com/',
  },
});
