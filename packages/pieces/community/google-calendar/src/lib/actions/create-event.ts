import { ActionContext, createAction, Property } from '@activepieces/pieces-framework';
import { googleCalendarCommon, googleCalendarAuth, createGoogleClient } from '../common';
import dayjs from 'dayjs';
import { calendar as googleCalendar } from '@googleapis/calendar';
import { randomUUID } from 'crypto';

import { eventOutputSchema } from '../output-schemas';
export const createEventProps = {
  calendar_id: googleCalendarCommon.calendarDropdown('writer'),
  title: Property.ShortText({
    displayName: 'Title',
    required: true,
  }),
  start_date_time: Property.DateTime({
    displayName: 'Start Time',
    required: true,
  }),
  end_date_time: Property.DateTime({
    displayName: 'End Time',
    description: 'Defaults to 30 minutes after the start.',
    required: false,
  }),
  location: Property.ShortText({
    displayName: 'Location',
    required: false,
  }),
  /*attachment: Property.ShortText({
    displayName: 'Attachment',
    description: 'URL of the file to be attached',
    required: false,
  }),*/
  description: Property.LongText({
    displayName: 'Description',
    description: 'HTML tags are allowed.',
    required: false,
  }),
  colorId: googleCalendarCommon.colorId,
  attendees: Property.Array({
    displayName: 'Attendees',
    description: 'One guest email per item.',
    required: false,
  }),
  guests_can_modify: Property.Checkbox({
    displayName: 'Guests Can Modify',
    defaultValue: false,
    required: false,
    advanced: true,
  }),
  guests_can_invite_others: Property.Checkbox({
    displayName: 'Guests Can Invite Others',
    defaultValue: false,
    required: false,
    advanced: true,
  }),
  guests_can_see_other_guests: Property.Checkbox({
    displayName: 'Guests Can See Other Guests',
    defaultValue: false,
    required: false,
    advanced: true,
  }),
  send_notifications: Property.StaticDropdown({
    displayName: 'Send Notifications',
    description: 'Who gets an email invitation for the new event.',
    defaultValue: 'all',
    options: {
      options: [
        { label: 'All guests', value: 'all' },
        {
          label: 'External guests only',
          value: 'externalOnly',
        },
        { label: 'No one', value: 'none' },
      ],
    },
    required: true,
  }),
  create_meet_link: Property.Checkbox({
    displayName: 'Create Google Meet Link',
    description: 'Adds a Google Meet link to the event.',
    defaultValue: false,
    required: false,
  }),
};

export async function runCreateEvent(
  context: ActionContext<typeof googleCalendarAuth, typeof createEventProps>
) {
  // docs: https://developers.google.com/calendar/api/v3/reference/events/insert
  const {
    calendar_id: calendarId,
    title: summary,
    start_date_time,
    end_date_time,
    location,
    description,
    colorId,
    guests_can_modify: guestsCanModify,
    guests_can_invite_others: guestsCanInviteOthers,
    guests_can_see_other_guests: guestsCanSeeOtherGuests,
    create_meet_link: createMeetLink,
  } = context.propsValue;

  const start = {
    dateTime: dayjs(start_date_time).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
  };
  const endTime = end_date_time
    ? end_date_time
    : dayjs(start_date_time).add(30, 'm');
  const end = {
    dateTime: dayjs(endTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
  };

  /*const attachment = {
    fileUrl: context.propsValue.attachment,
  };*/

  const attendeesArray = context.propsValue.attendees as string[];

  const sendNotifications = context.propsValue.send_notifications;

  const attendeesObject = [];
  if (attendeesArray) {
    for (const attendee of attendeesArray) {
      attendeesObject.push({ email: attendee });
    }
  }

  const authClient = await createGoogleClient(context.auth);

  const calendar = googleCalendar({ version: 'v3', auth: authClient });

  const requestBody: any = {
    summary,
    start,
    end,
    colorId,
    //attachments: context.propsValue.attachment ? [attachment] : [],
    location: location ?? '',
    description: description ?? '',
    attendees: attendeesObject,
    guestsCanInviteOthers,
    guestsCanModify,
    guestsCanSeeOtherGuests,
  };

  if (createMeetLink) {
    requestBody.conferenceData = {
      createRequest: {
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
        requestId: randomUUID(),
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId,
    sendUpdates: sendNotifications,
    conferenceDataVersion: createMeetLink ? 1 : 0,
    requestBody,
  });

  return response.data;
}

export const createEvent = createAction({
  auth: googleCalendarAuth,
  name: 'create_google_calendar_event',
  classification: 'WRITE',
  description: 'Creates an event with a title, time, guests and options.',
  audience: 'human',
  aiMetadata: { description: 'Creates a Google Calendar event with structured fields (title, start/end times, location, description, attendees, color, guest permissions) and can optionally attach a Google Meet link. Use this when you have explicit event details; choose Create Quick Event instead when working from a single natural-language phrase. Requires a title and start time (end defaults to 30 minutes after start). Not idempotent: each call creates a new event.', idempotent: false },
  displayName: 'Create Event',
  props: createEventProps,
  outputSchema: eventOutputSchema,
  run: runCreateEvent,
});
