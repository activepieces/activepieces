import {
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarCommon } from '../common';
import { GoogleCalendarEvent } from '../common/types';
import { googleCalendarAuth } from '../../';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { getEvents } from '../common/helper';

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  {
    calendar_id: string | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const calendarId = propsValue.calendar_id;

    if (!calendarId) {
      return [];
    }
    
    
    let minUpdated: Date;
    if (lastFetchEpochMS === 0) {
      
      minUpdated = new Date();
      minUpdated.setDate(minUpdated.getDate() - 1);
    } else {
      minUpdated = new Date(lastFetchEpochMS);
    }

    
    const events = await getEvents(calendarId, true, auth, minUpdated);

    
    const cancelledEvents = events.filter(event => event.status === 'cancelled');

    
    return cancelledEvents.map((event) => {
        return {
            epochMilliSeconds: new Date(event.updated!).getTime(),
            data: event,
        };
    });
  },
};

export const eventCancelled = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_cancelled',
  displayName: 'Event Cancelled',
  description: 'Fires when an event is canceled or deleted.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
      "id": "abc123def456_cancelled",
      "summary": "Cancelled: Q3 Planning Session",
      "status": "cancelled",
      "created": "2025-07-20T10:00:00.000Z",
      "updated": "2025-08-14T09:30:00.000Z",
      "organizer": { "email": "project.manager@example.com" },
      "start": { "dateTime": "2025-08-25T10:00:00-07:00" },
      "end": { "dateTime": "2025-08-25T11:30:00-07:00" },
  },

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

  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});