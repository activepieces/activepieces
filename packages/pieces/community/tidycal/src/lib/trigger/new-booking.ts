import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { calltidycalapi } from '../common';
import { tidyCalAuth } from '../../';
import dayjs from 'dayjs';

export const tidycalnewbooking = createTrigger({
  auth: tidyCalAuth,
  name: 'new_booking',
  displayName: 'New Booking',
  description: 'Triggers when a new booking is created',
  props: {},
  sampleData: {
    data: [
      {
        id: 1,
        contact_id: 1,
        booking_type_id: 1,
        starts_at: '2022-01-01T00:00:00.000000Z',
        ends_at: '2022-02-01T00:00:00.000000Z',
        cancelled_at: '2022-02-01T00:00:00.000000Z',
        created_at: '2022-02-01T00:00:00.000000Z',
        updated_at: '2022-02-01T00:00:00.000000Z',
        timezone: 'America/Los_Angeles',
        meeting_url: 'https://zoom.us/j/949494949494',
        meeting_id: 'fw44lkj48fks',
        questions: {},
        contact: {
          id: '1',
          email: 'john@doe.com',
          name: 'John Doe',
          created_at: '2022-01-01T00:00:00.000000Z',
          updated_at: '2022-01-01T00:00:00.000000Z',
        },
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await calltidycalapi<{
      data: {
        id: string;
        created_at: string;
      }[];
    }>(HttpMethod.GET, `bookings?cancelled=false`, auth, undefined);

    const createdBookings = currentValues.body;
    const bookings = createdBookings.data.filter((item) => {
      const created_at = dayjs(item.created_at);
      return created_at.isAfter(lastFetchEpochMS);
    });
    return bookings.map((item) => {
      return {
        epochMilliSeconds: dayjs(item.created_at).valueOf(),
        data: item,
      };
    });
  },
};
