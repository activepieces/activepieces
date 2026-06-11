import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { outlookCalendarAuth } from '../..';
import { outlookCalendarCommon } from '../common/common';

export const deleteEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'delete_event',
  description: 'Delete an event in a calendar',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a specific event from a Microsoft Outlook calendar, identified by its calendar and event ID. Use to remove a known meeting or appointment. Requires the exact event ID. Not strictly idempotent: a repeat call for an already-deleted event will error, though no new side effect occurs.', idempotent: false },
  displayName: 'Delete an event in a calendar',
  props: {
    calendarId: outlookCalendarCommon.calendarDropdown,
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const cloud = (auth as unknown as { props?: Record<string, unknown> }).props?.['cloud'] as string | undefined;
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${outlookCalendarCommon.getBaseUrl(cloud)}/calendars/${propsValue.calendarId}/events/${propsValue.eventId}`,
      body: {},
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
