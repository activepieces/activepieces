import { createAction, Property } from '@activepieces/framework';
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import { googleCalendarCommon } from '../common';

export const createQuickCalendarEvent = createAction({
  name: 'create_quick_event',
  description: 'Add Quick Calendar Event',
  displayName: 'Quick Event',
  props: {
    authentication: googleCalendarCommon.authentication,
    calendar_id: googleCalendarCommon.calendarDropdown,
    text: Property.LongText({
      displayName: 'Summary',
      description: 'The text describing the event to be created',
      required: true,
    }),
    send_updates: Property.Dropdown<string>({
      displayName: "Send Updates",
      description: "Guests who should receive notifications about the creation of the new event.",
      refreshers: [],
      required: false,
      options: async () => {
        return {
          disabled: false,
          options: [
            {
              label: "All",
              value: "all",
            },
            {
              label: "External Only",
              value: "externalOnly",
            },
            {
              label: "none",
              value: "none",
            }
          ]
        };
      }
    }),
  },
  async run(configValue) {
    // docs: https://developers.google.com/calendar/api/v3/reference/events/quickAdd
    const calendarId = configValue.propsValue['calendar_id'];
    const url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events/quickAdd`;
    const qParams: Record<string, string> = {
      text: configValue.propsValue['text']!,
      sendUpdates: configValue.propsValue['send_updates'] || "none",
    };
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url,
      body: {},
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: configValue.propsValue['authentication']!['access_token'],
      },
      queryParams: qParams,
    };
    return await httpClient.sendRequest(request);
  },
});
