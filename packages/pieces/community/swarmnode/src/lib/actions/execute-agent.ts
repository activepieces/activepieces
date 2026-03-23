import { createAction, Property } from "@activepieces/pieces-framework";
import { swarmnodeAuth } from "../common/auth";
import { agentIdDropdown } from "../common/props";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { BASE_URL } from "../common/constants";
import { ListExecutionResponse } from "../common/types";

export const executeAgentAction = createAction({
    name:'execute-agent',
    auth:swarmnodeAuth,
    displayName:'Execute Agent',
    description:'Executes an existing AI agent.',
    props:{
        agentId:agentIdDropdown,
        payload:Property.Json({
            displayName:'Agent Input Payload',
            required:true
        })
    },
    async run(context)
    {
        const {agentId,payload} = context.propsValue;

        const createJobRsponse = await httpClient.sendRequest<{id:string,agent_id:string}>({
            method:HttpMethod.POST,
            url:BASE_URL + '/agent-executor-jobs/create/',
            authentication:{
                type:AuthenticationType.BEARER_TOKEN,
                token:context.auth.secret_text
            },
            body:{
                agent_id:agentId,
                payload
            }
        })

        const jobId = createJobRsponse.body.id;
        let status = 'in_progress';
        const timeoutAt = Date.now() + 5 * 60 * 1000;

        while(status !='success' && Date.now() < timeoutAt)
        {
            await new Promise((resolve) => setTimeout(resolve, 5000)); 

			const pollResponse = await httpClient.sendRequest<ListExecutionResponse>({
				method: HttpMethod.GET,
				url: BASE_URL + '/executions/',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth.secret_text,
				},
                queryParams:{
                    agent_executor_job_id:jobId,
                    agent_id:agentId
                }
			});

			status = pollResponse.body.results[0].status;

			if (status === 'success') return pollResponse.body.results[0];
        }

        throw new Error('Execution Job timed out or failed.');

    }
})