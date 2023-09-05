import { sessionCommon } from "../common/common";
import { sessionAuth } from "../..";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { Property, createAction } from "@activepieces/pieces-framework";

export const createBooking = createAction({
    auth: sessionAuth,
    name: "create_booking",
    displayName: "Create Booking",
    description: "Create a new booking\n **WARNING**\n You cannot create a booking on your own page",
    props: {
        book_id: sessionCommon.booking_id,
        name: Property.ShortText({
            displayName: "Name",
            description: "The name of the session.",
            required: true,
            defaultValue: "AP Session",
        }),
        startAt: Property.DateTime({
            displayName: "Date & Time",
            description: "Select a date and time",
            required: true,
            defaultValue: "2023-06-09T12:00:00Z"
        }),
        plannedEnd: Property.DateTime({
            displayName: "Date & Time",
            description: "Select a date and time",
            required: true,
            defaultValue: "2023-06-09T12:00:00Z"
        }),
        timezone: Property.ShortText({
            displayName: "Timezone",
            description: "The timezone which the session will take place.",
            required: true,
        }),
        },
    async run({propsValue, auth}) {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${sessionCommon.baseUrl}/sessions`,
            headers: {
                "accept":"application/json",
                "x-api-key":auth,
            },
            body: {
                name: propsValue['name'],
                startAt: propsValue['startAt'],
                plannedEnd: propsValue['plannedEnd'],
                timezone: propsValue['timezone'],
            }
        }
        return await httpClient.sendRequest(request);
    }
})