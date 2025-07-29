import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { agentCommon } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AgentRun, RunAgentRequestBody } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';


export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run the AI assistant to complete your task.',
  auth: PieceAuth.None(),
  errorHandlingOptions: {
    retryOnFailure: {
      hide: true,
    },
    continueOnFailure: {
      hide: true,
    },
  },
  props: {
    agentId: Property.Dropdown({
      displayName: 'Agent',
      description: 'Select agent created',
      required: true,
      refreshers: [],
      options: async (_auth, ctx) => {
        const agentPage = await agentCommon.listAgents({
          publicUrl: ctx.server.publicUrl,
          token: ctx.server.token,
        })
        return {
          disabled: false,
          options: agentPage.body.data.map((agent) => {
            return {
              label: agent.displayName,
              value: agent.externalId,
            };
          }),
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
  },
  async run(context) {
    const { agentId, prompt } = context.propsValue
    const serverToken = context.server.token;

    const body: RunAgentRequestBody = {
      externalId: agentId,
      prompt,
    }

    const response = await httpClient.sendRequest<AgentRun>({
      method: HttpMethod.POST,
      url: `${context.server.publicUrl}v1/agent-runs`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: serverToken,
      },
      body
    })

    if (response.status !== StatusCodes.OK) {
      throw new Error(response.body.message)
    }

    const agentRun = await agentCommon.pollAgentRunStatus({
      publicUrl: context.server.publicUrl,
      token: serverToken,
      agentRunId: response.body.id,
      update: async (data: AgentRun) => {
        await context.output.update({
          data: mapAgentRunToOutput(data),
        })
      },
    });

    return mapAgentRunToOutput(agentRun)
  },
});


function mapAgentRunToOutput(agentRun: AgentRun): Record<string, unknown> {
  return {
    steps: agentRun.steps,
    status: agentRun.status,
    output: agentRun.output,
    agentRunId: agentRun.id,
    message: agentRun.message
  }
}