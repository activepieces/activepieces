import { createAction, Property } from '@activepieces/pieces-framework';
import { outlookCalendarAuth } from '../auth';
import { outlookCalendarClient } from '../common/client';
import { outlookCalendarProps } from '../common/props';

export const deleteEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'delete_event',
  classification: 'DESTRUCTIVE',
  description: 'Delete an event in a calendar',
  audience: 'human',
  aiMetadata: { description: 'Permanently deletes a specific event from a Microsoft Outlook calendar, identified by its calendar and event ID. Use to remove a known meeting or appointment. Requires the exact event ID. Not strictly idempotent: a repeat call for an already-deleted event will error, though no new side effect occurs.', idempotent: false },
  displayName: 'Delete an event in a calendar',
  props: {
    calendarId: outlookCalendarProps.calendarId({ required: true }),
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const response: unknown = await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendars/${propsValue.calendarId}/events/${propsValue.eventId}`)
      .delete();
    return response;
  },
});
