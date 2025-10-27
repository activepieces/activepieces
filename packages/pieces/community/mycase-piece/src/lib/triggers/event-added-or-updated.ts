import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';
import dayjs from 'dayjs';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const api = createMyCaseApi(auth);

    const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();

    const queryParams: Record<string, string> = {
      'filter[updated_after]': lastFetchDate,
      page_size: '1000',
    };

    const response = await api.get('/events', queryParams);

    if (response.success && Array.isArray(response.data)) {
      return response.data.map((event: any) => ({
        epochMilliSeconds: dayjs(event.created_at).valueOf(),
        data: event,
      }));
    }

    return [];
  },
};

export const eventAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'event_added_or_updated',
  displayName: 'Event Added or Updated',
  description: 'Triggers when an event has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    name: 'Client Meeting',
    description: 'Initial consultation with client',
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T11:00:00Z',
    all_day: false,
    private: false,
    event_type: 'Meeting',
    location: {
      id: 1,
    },
    case: {
      id: 100,
    },
    staff: [
      {
        id: 5,
      },
    ],
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T09:30:00Z',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
});
