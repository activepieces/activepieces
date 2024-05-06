import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCalendarCommon } from '../common';
import dayjs from 'dayjs';
import { googleCalendarAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const createEvent = createAction({
  auth: googleCalendarAuth,
  name: 'create_google_calendar_event',
  description: 'Add Event',
  displayName: 'Create Event',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    title: Property.ShortText({
      displayName: 'Title of the event',
      required: true,
    }),
    start_date_time: Property.DateTime({
      displayName: 'Start date time of the event',
      required: true,
    }),
    end_date_time: Property.DateTime({
      displayName: 'End date time of the event',
      description: "By default it'll be 30 min post start time",
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
    send_notifications: Property.StaticDropdown({
      displayName: 'Send Notifications',
      defaultValue: 'all',
      options: {
        options: [
          { label: 'Yes, to everyone', value: 'all' },
          {
            label: 'To non-Google Calendar guests only',
            value: 'externalOnly',
          },
          { label: 'To no one', value: 'none' },
        ],
      },
      required: true,
    }),
  },
  async run(configValue) {
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
    } = configValue.propsValue;

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
      fileUrl: configValue.propsValue.attachment,
    };*/

    const attendeesArray = configValue.propsValue.attendees as string[];

    const sendNotifications = configValue.propsValue.send_notifications;

    const attendeesObject = [];
    if (attendeesArray) {
      for (const attendee of attendeesArray) {
        attendeesObject.push({ email: attendee });
      }
    }

    const authClient = new OAuth2Client();
    authClient.setCredentials(configValue.auth);

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const response = await calendar.events.insert({
      calendarId,
      sendUpdates: sendNotifications,
      requestBody: {
        summary,
        start,
        end,
        colorId,
        //attachments: configValue.propsValue.attachment ? [attachment] : [],
        location: location ?? '',
        description: description ?? '',
        attendees: attendeesObject,
        guestsCanInviteOthers,
        guestsCanModify,
        guestsCanSeeOtherGuests,
      },
    });

    return response.data;
  },
});
