import { createAction, Property } from "@activepieces/pieces-framework";
import { leexiAuth } from "../common/auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";

export const getCallAction = createAction({
    name: 'get-call',
    auth: leexiAuth,
    displayName: 'Get Call',
    description: 'Gets call details.',
    audience: 'both',
    aiMetadata: { description: 'Retrieves the full details of a single Leexi call (recording/transcription session) by its call ID. Use this to look up a specific call when you already have its ID, e.g. after a "New Call Created" trigger fires. Read-only; safe to retry.', idempotent: true },
    props: {
        callId: Property.ShortText({
            displayName: 'Call ID',
            required: true
        })
    },
    async run(context) {
        const { callId } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: BASE_URL + `/calls/${callId}`,
            authentication: {
                type: AuthenticationType.BASIC,
                username: context.auth.username,
                password: context.auth.password
            }
        })

        return response.body;
    }
})