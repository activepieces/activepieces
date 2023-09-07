import { sessionCommon } from "../common/common";
import { sessionAuth } from "../..";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { Property, createAction } from "@activepieces/pieces-framework";

export const createSession = createAction({
    auth: sessionAuth,
    name: "create_session",
    displayName: "Create Session",
    description: "Quickly create a session.",
    props: {
        name: Property.ShortText({
            displayName: "Session Name",
            description: "The name of the session",
            required: true,
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
            url: `${sessionCommon.baseUrl}sessions`,
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
        const response = await httpClient.sendRequest(request);
        return response.body['sessionLink']
    }
})