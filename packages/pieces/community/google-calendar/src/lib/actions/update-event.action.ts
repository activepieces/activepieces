import { ActionContext, MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { calendar as googleCalendar, calendar_v3 } from '@googleapis/calendar';
import { googleCalendarCommon, googleCalendarAuth, createGoogleClient } from '../common';
import dayjs from 'dayjs';

import { eventOutputSchema } from '../output-schemas';
export const updateEventProps = {
  calendar_id: googleCalendarCommon.calendarDropdown('writer'),
  eventId: Property.ShortText({
    displayName: 'Event ID',
    description: 'Paste the ID from the event URL or a previous step.',
    required: true,
  }),
  hint: Property.MarkDown({
    value: 'Empty fields keep their current value.',
    variant: MarkdownVariant.INFO,
  }),
  title: Property.ShortText({
    displayName: 'Title',
    required: false,
  }),
  start_date_time: Property.DateTime({
    displayName: 'Start Time',
    required: false,
  }),
  end_date_time: Property.DateTime({
    displayName: 'End Time',
    required: false,
  }),
  location: Property.ShortText({
    displayName: 'Location',
    required: false,
  }),
  description: Property.LongText({
    displayName: 'Description',
    description: 'HTML tags are allowed.',
    required: false,
  }),
  colorId: googleCalendarCommon.colorId(),
  attendees: Property.Array({
    displayName: 'Attendees',
    description: 'Replaces the current guest list. One email per item.',
    required: false,
  }),
  guests_can_modify: guestPermission('Guests Can Modify'),
  guests_can_invite_others: guestPermission('Guests Can Invite Others'),
  guests_can_see_other_guests: guestPermission('Guests Can See Other Guests'),
};

export async function runUpdateEvent(
  context: ActionContext<typeof googleCalendarAuth, typeof updateEventProps>
) {
  const {
    calendar_id,
    eventId,
    title,
    start_date_time,
    end_date_time,
    location,
    description,
    colorId,
    guests_can_invite_others,
    guests_can_modify,
    guests_can_see_other_guests,
  } = context.propsValue;

  const attendees = context.propsValue.attendees as string[];

  const authClient = await createGoogleClient(context.auth);
  const calendar = googleCalendar({ version: 'v3', auth: authClient });

  // Note that each patch request consumes three quota units;
  // prefer using a get followed by an update
  const currentEvent = await calendar.events.get({
    calendarId: calendar_id,
    eventId: eventId,
  });

  const overrides: calendar_v3.Schema$Event = {
    ...(title !== undefined && { summary: title }),
    ...(description !== undefined && { description }),
    ...(location !== undefined && { location }),
    ...(colorId !== undefined && { colorId }),
    ...(Array.isArray(attendees) &&
      attendees.length > 0 && {
        attendees: attendees.map((email) => ({ email })),
      }),
    ...(start_date_time !== undefined && {
      start: toEventDateTime({ value: start_date_time, current: currentEvent.data.start }),
    }),
    ...(end_date_time !== undefined && {
      end: toEventDateTime({ value: end_date_time, current: currentEvent.data.end }),
    }),
    ...(typeof guests_can_invite_others === 'boolean' && {
      guestsCanInviteOthers: guests_can_invite_others,
    }),
    ...(typeof guests_can_modify === 'boolean' && {
      guestsCanModify: guests_can_modify,
    }),
    ...(typeof guests_can_see_other_guests === 'boolean' && {
      guestsCanSeeOtherGuests: guests_can_see_other_guests,
    }),
  };

  const response = await calendar.events.update({
    calendarId: calendar_id,
    eventId: eventId,
    conferenceDataVersion: 1,
    requestBody: {
      ...currentEvent.data,
      ...overrides,
    },
  });

  return response.data;
}

export const updateEventAction = createAction({
  displayName: 'Update Event',
  auth: googleCalendarAuth,
  name: 'update_event',
  classification: 'WRITE',
  description: 'Updates an existing event; empty fields keep their value.',
  audience: 'human',
  aiMetadata: { description: 'Updates the fields of an existing Google Calendar event identified by calendar and event ID (title, times, location, description, color, attendees, guest permissions); unset fields retain their current values. Use to modify or reschedule an event that already exists rather than creating a new one. Requires the event ID. Idempotent: applying the same field values repeatedly leaves the event in the same state.', idempotent: true },
  props: updateEventProps,
  outputSchema: eventOutputSchema,
  run: runUpdateEvent,
});

function guestPermission(displayName: string) {
  return Property.StaticDropdown<boolean>({
    displayName,
    required: false,
    options: {
      disabled: false,
      placeholder: 'Keep current setting',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

function toEventDateTime({
  value,
  current,
}: {
  value: string;
  current: calendar_v3.Schema$EventDateTime | undefined;
}): calendar_v3.Schema$EventDateTime {
  return {
    dateTime: dayjs(value).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    ...(current?.timeZone && { timeZone: current.timeZone }),
  };
}
