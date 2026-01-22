import { createAction, Property } from "@activepieces/pieces-framework";
import { fellowAuth, getBaseUrl } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getNoteAction = createAction({
    name: 'get-note',
    auth: fellowAuth,
    displayName: 'Get AI Note',
    description: 'Retrieves a note by its ID.',
    props: {
        noteId: Property.ShortText({
            displayName: 'Note ID',
            required: true
        })
    },
    async run(context) {
        const { subdomain, apiKey } = context.auth.props;
        const { noteId } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: getBaseUrl(subdomain) + `/note/${noteId}`,
            headers: {
                'X-API-KEY': apiKey
            }
        })

        return response.body;

    }
})