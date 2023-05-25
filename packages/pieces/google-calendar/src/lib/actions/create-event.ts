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
        title: Property.ShortText({
            displayName: 'Title of the event',
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
            title: summary,
            startDateTime,
            endDateTime
        } = configValue.propsValue;
        const {access_token:token} = authentication;
        const start = {
            dateTime: dayjs(startDateTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        };
        const end = {
            dateTime: dayjs(endDateTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        };
        const url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`;
        const request: HttpRequest<Record<string, unknown>> = {
            method: HttpMethod.POST,
            url,
            body:{
                summary,
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
