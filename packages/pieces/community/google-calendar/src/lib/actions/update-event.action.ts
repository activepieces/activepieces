import { Property, createAction } from '@activepieces/pieces-framework';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleCalendarAuth } from '../../index';
import { googleCalendarCommon } from '../common';
import dayjs from 'dayjs';

export const updateEventAction = createAction({
  displayName: 'Update Event',
  auth: googleCalendarAuth,
  name: 'update_event',
  description: 'Updates an event in Google Calendar.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title of the event',
      required: false,
    }),
    start_date_time: Property.DateTime({
      displayName: 'Start date time of the event',
      required: false,
    }),
    end_date_time: Property.DateTime({
      displayName: 'End date time of the event',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the event. You can use HTML tags here.',
      required: false,
    }),
    colorId: googleCalendarCommon.colorId,
    attendees: Property.Array({
      displayName: 'Attendees',
      description: 'Emails of the attendees (guests)',
      required: false,
    }),
    guests_can_modify: Property.Checkbox({
      displayName: 'Guests can modify',
      defaultValue: false,
      required: false,
    }),
    guests_can_invite_others: Property.Checkbox({
      displayName: 'Guests can invite others',
      defaultValue: false,
      required: false,
    }),
    guests_can_see_other_guests: Property.Checkbox({
      displayName: 'Guests can see other guests',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
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

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    // Note that each patch request consumes three quota units;
    // prefer using a get followed by an update
    const currentEvent = await calendar.events.get({
      calendarId: calendar_id,
      eventId: eventId,
    });

    let attendeeFormattedList: calendar_v3.Schema$EventAttendee[] = [];
    if (Array.isArray(attendees) && attendees.length > 0) {
      attendeeFormattedList = attendees.map((email) => ({ email }));
    } else if (
      currentEvent.data.attendees &&
      Array.isArray(currentEvent.data.attendees)
    ) {
      attendeeFormattedList = currentEvent.data.attendees;
    }

    const response = await calendar.events.update({
      calendarId: calendar_id,
      eventId: eventId,
      requestBody: {
        summary: title ?? currentEvent.data.summary,
        attendees: attendeeFormattedList,
        description: description ?? currentEvent.data.description,
        colorId: colorId,
        location: location ?? currentEvent.data.location,
        start: start_date_time
          ? {
              dateTime: dayjs(start_date_time).format(
                'YYYY-MM-DDTHH:mm:ss.sssZ'
              ),
            }
          : currentEvent.data.start,
        end: end_date_time
          ? {
              dateTime: dayjs(end_date_time).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
            }
          : currentEvent.data.end,
        guestsCanInviteOthers: guests_can_invite_others,
        guestsCanModify: guests_can_modify,
        guestsCanSeeOtherGuests: guests_can_see_other_guests,
      },
    });

    return response.data;
  },
});
