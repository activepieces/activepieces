import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon } from '../common';
import { googleCalendarAuth } from '../../'; 
import { GoogleCalendarEvent } from '../common/types';

export const getEventById = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_event_by_id',
  displayName: 'Get Event by ID',
  description: 'Fetch event details by its unique ID.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'), 
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The unique ID of the event to fetch.',
      required: true,
    }),
  },
  async run(context) {
    const { calendar_id: calendarId, event_id: eventId } = context.propsValue;
    const { access_token: token } = context.auth;

   
    const url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events/${eventId}`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    };

    const response = await httpClient.sendRequest<GoogleCalendarEvent>(request);

    
    return response.body;
  },
});