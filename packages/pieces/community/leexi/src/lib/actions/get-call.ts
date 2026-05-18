import { createAction, Property } from "@activepieces/pieces-framework";
import { leexiAuth } from "../common/auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";

export const getCallAction = createAction({
    name: 'get-call',
    auth: leexiAuth,
    displayName: 'Get Call',
    description: 'Gets call details.',
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