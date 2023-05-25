import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import { googleCalendarCommon } from '../common';
import dayjs from "dayjs";

export const createEvent = createAction({
    name: 'create_google_calendar_event',
    description: 'Add Event',
    displayName: 'Create Event',
    props: {
        authentication: googleCalendarCommon.authentication,
        calendar_id: googleCalendarCommon.calendarDropdown('writer'),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The text describing the event to be created',
            required: true,
        }),
        startDateTime: Property.DateTime({
            displayName: 'Start date time of the event',
            required: true,
        }),
        endDateTime: Property.DateTime({
            displayName: 'End date time of the event',
            required: true,
        })
    },
    async run(configValue) {
        // docs: https://developers.google.com/calendar/api/v3/reference/events/insert
        const {
            authentication,
            calendar_id:calendarId,
            description,
            startDateTime,
            endDateTime
        } = configValue.propsValue;
        const {access_token:token} = authentication;
        const start = {
            date:dayjs(startDateTime).format('YYYY-MM-DD'),
            dateTime: startDateTime,
            timeZone:'Etc/Zulu'
        };
        const end = {
            date:dayjs(endDateTime).format('YYYY-MM-DD'),
            dateTime: endDateTime,
            timeZone:'Etc/Zulu'
        };
        const url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`;
        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url,
            body:{
                description,
                start,
                end
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token,
            },
        };
        return await httpClient.sendRequest(request);
    },
});
