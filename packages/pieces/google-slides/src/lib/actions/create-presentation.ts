import { googleSlidesAuth } from "../..";
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, HttpRequest, AuthenticationType } from "@activepieces/pieces-common";


export const createPresentation = createAction({
    auth: googleSlidesAuth,
    name: "create_presentation",
    description: "Create a new presentation",
    displayName: "Create Presentation",
    props: {
        title: Property.ShortText({
            displayName: "Title",
            description: "Title of the presentation",
            required: false
        }),

    },
    async run(context) {
        const baseUrl = "https://slides.googleapis.com/v1/presentations";
        const authProp = context.auth;
        const { title } = context.propsValue;
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: baseUrl,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: authProp['access_token'],
            },
            body: {
                "title":title
            }
        }
        return await httpClient.sendRequest(request);

    }
});