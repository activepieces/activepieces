import { createAction, Property } from "@activepieces/pieces-framework";
import { swarmnodeAuth } from "../common/auth";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";

export const getExecutionAction = createAction({
    name: 'get-execution',
    auth: swarmnodeAuth,
    displayName: 'Get Execution',
    description: "Gets AI Agent's execution details.",
    audience: 'both',
    aiMetadata: { description: 'Retrieves the details and result of a single SwarmNode agent execution by its agent executor job ID. Use to look up the status or output of a previously started execution. Read-only and idempotent.', idempotent: true },
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