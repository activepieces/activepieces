import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon, googleCalendarAuth, getAccessToken } from '../common';
import { quickEventActionOutputSchema } from '../output-schemas';

export const createQuickCalendarEvent = createAction({
  auth: googleCalendarAuth,
  name: 'create_quick_event',
  classification: 'WRITE',
  description: 'Creates an event from a plain-language phrase.',
  audience: 'both',
  aiMetadata: { description: 'Creates a calendar event from a single natural-language phrase (e.g. "Lunch with Sam tomorrow at 1pm") via Google\'s quickAdd parsing, letting Google infer the time, title, and date. Use when you have free-form text rather than structured fields; prefer Create Event when you have explicit start/end times or attendees. Not idempotent: each call creates a new event.', idempotent: false },
  displayName: 'Create Quick Event',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    text: Property.LongText({
      displayName: 'Event Text',
      description: 'e.g. "Lunch with Sam tomorrow at 1pm".',
      required: true,
    }),
    send_updates: Property.StaticDropdown<string>({
      displayName: 'Send Updates',
      description: 'Who gets an email invitation for the new event.',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'All guests',
            value: 'all',
          },
          {
            label: 'External guests only',
            value: 'externalOnly',
          },
          {
            label: 'No one',
            value: 'none',
          },
        ],
      },
    }),
  },
  outputSchema: quickEventActionOutputSchema,
  async run(configValue) {
    // docs: https://developers.google.com/calendar/api/v3/reference/events/quickAdd
    const calendarId = configValue.propsValue['calendar_id'];
    const url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events/quickAdd`;
    const qParams: Record<string, string> = {
      text: configValue.propsValue['text'],
      sendUpdates: configValue.propsValue['send_updates'] || 'none',
    };
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url,
      body: {},
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(configValue.auth),
      },
      queryParams: qParams,
    };
    return await httpClient.sendRequest(request);
  },
});
