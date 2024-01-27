import { googleCalendarAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleCalendarCommon } from '../common';



export const updateEventAction = createAction({
    displayName: 'Update Event',
    auth: googleCalendarAuth,
    name: 'update_event',
    description: 'Update an event in Google Calendar',
    props: {
        calendar_id: googleCalendarCommon.calendarDropdown('writer'),
        eventId: Property.ShortText({
            displayName: 'Event ID',
            required: true,
        }),
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
            required: true,
        }),
    },
    async run(context) {
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);

        const calendarId = context.propsValue.calendar_id;
        const eventId = context.propsValue.eventId;
        const summary = context.propsValue.title;
        const start = context.propsValue.start_date_time;
        const end = context.propsValue.end_date_time;

        const calendar = google.calendar({ version: 'v3', auth: authClient });

        const response = await calendar.events.update({
            calendarId,
            eventId,
            requestBody: {
                summary,
                start: {
                    dateTime: start,
                },
                end: {
                    dateTime: end,
                },
            },
        });

        return response.data;

    }

});