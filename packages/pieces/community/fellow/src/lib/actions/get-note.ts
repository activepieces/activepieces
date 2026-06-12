import { createAction, Property } from "@activepieces/pieces-framework";
import { fellowAuth, getBaseUrl } from "../common/auth";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getNoteAction = createAction({
    name: 'get-note',
    auth: fellowAuth,
    displayName: 'Get AI Note',
    description: 'Retrieves a note by its ID.',
    audience: 'both',
    aiMetadata: { description: 'Fetches a single Fellow AI meeting note by its note ID. Use to read the content of a known note when you already have its ID (e.g. from a recording or a prior step). Requires the exact note ID; read-only and idempotent.', idempotent: true },
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