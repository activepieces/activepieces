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
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';


interface GoogleCalendarEventList {
  items: GoogleCalendarEvent[];
}

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  {
    calendar_id: string | undefined;
    search_term: string | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { calendar_id, search_term } = propsValue;

    if (!calendar_id || !search_term) {
      
      return [];
    }
    
   
    let minUpdated: Date;
    if (lastFetchEpochMS === 0) {
      
      minUpdated = new Date();
      minUpdated.setDate(minUpdated.getDate() - 1);
    } else {
      minUpdated = new Date(lastFetchEpochMS);
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${calendar_id}/events`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      queryParams: {
        singleEvents: 'true',
        orderBy: 'updated',
        updatedMin: minUpdated.toISOString(),
        q: search_term, 
      },
    };

    const response = await httpClient.sendRequest<GoogleCalendarEventList>(request);
    const events = response.body.items;

    
    const newEvents = events.filter(event => {
        const created = new Date(event.created ?? 0).getTime();
        const updated = new Date(event.updated ?? 0).getTime();
        
        return (updated - created < 5000);
    })

    
    return newEvents.map((event) => {
        return {
            epochMilliSeconds: new Date(event.updated!).getTime(),
            data: event,
        };
    });
  },
};

export const newEventMatchingSearch = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event_matching_search',
  displayName: 'New Event Matching Search',
  description: 'Fires when a new event is created that matches a specified search term.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    search_term: Property.ShortText({
        displayName: 'Search Term',
        description: 'The keyword(s) to search for in new events.',
        required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
      "id": "abc123def456",
      "summary": "Final Project Review",
      "description": "Review of the Q3 final project deliverables.",
      "status": "confirmed",
      "created": "2025-08-14T09:05:00.000Z",
      "updated": "2025-08-14T09:05:01.000Z",
      "start": { "dateTime": "2025-09-01T10:00:00-07:00" },
      "end": { "dateTime": "2025-09-01T11:30:00-07:00" },
      "organizer": { "email": "project.manager@example.com" }
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