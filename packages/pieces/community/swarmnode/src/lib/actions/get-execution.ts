import { createAction, Property } from "@activepieces/pieces-framework";
import { swarmnodeAuth } from "../common/auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";

export const getExecutionAction = createAction({
    name: 'get-execution',
    auth: swarmnodeAuth,
    displayName: 'Get Execution',
    description: "Gets AI Agent's execution details.",
    props: {
        jobId: Property.ShortText({
            displayName: 'Agent Executor Job ID',
            required: true
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: BASE_URL + `/executions/${context.propsValue.jobId}/`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.secret_text
            }
        })

        return response.body;

    }
})