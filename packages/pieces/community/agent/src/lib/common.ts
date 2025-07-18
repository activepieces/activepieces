import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { Agent, createAIProvider, SeekPage, AgentRun, AgentTaskStatus } from "@activepieces/shared"
import { openai } from "@ai-sdk/openai";
import { StatusCodes } from "http-status-codes";


export const agentCommon = {
  async initializeOpenAIModel(params: InitOpenAI) {
    const baseURL = `${params.publicUrl}v1/ai-providers/proxy/openai`;
    const engineToken = params.token;
    return createAIProvider({
      providerName: 'openai',
      modelInstance: openai('gpt-4o-mini'),
      apiKey: engineToken,
      baseURL,
    });
  },
  listAgents(params: ListAgents) {
    return httpClient.sendRequest<SeekPage<Agent>>({
      method: HttpMethod.GET,
      url: `${params.publicUrl}v1/agents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: params.token,
      },
    })
  },
  async getAgent(params: GetAgent) {
    const response = await httpClient.sendRequest<Agent>({
      method: HttpMethod.GET,
      url: `${params.publicUrl}v1/agents/${params.id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: params.token,
      },
    })
    return response.body
  },
  async pollAgentRunStatus(params: PollAgentRunParams): Promise<AgentRun> {
    // 2 * 300 = 600 seconds (default timeout)
    const { publicUrl, token, agentRunId, update, intervalSeconds = 2, maxAttempts = 300 } = params;
    
    let lastAgentRun: AgentRun;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await httpClient.sendRequest<AgentRun>({
        method: HttpMethod.GET,
        url: `${publicUrl}v1/agent-runs/${agentRunId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: token,
        },
      });

      if (response.status !== StatusCodes.OK) {
        throw new Error(response.body.message);
      }

      lastAgentRun = response.body;

      await update({
        steps: lastAgentRun.steps,
        status: lastAgentRun.status,
        output: lastAgentRun.output,
        message: lastAgentRun.message
      })

      // Check if the agent run is completed
      if (lastAgentRun.status === AgentTaskStatus.COMPLETED || lastAgentRun.status === AgentTaskStatus.FAILED) {
        return lastAgentRun;
      }

      // If not the last attempt, wait before polling again
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
      }
    }

    // Return the last fetched agent run
    return lastAgentRun!
  }
}

type GetAgent = {
  publicUrl: string
  token: string
  id: string
}

type ListAgents = {
  publicUrl: string
  token: string
}

type InitOpenAI = {
  publicUrl: string
  token: string

}

type PollAgentRunParams = {
  publicUrl: string;
  token: string;
  agentRunId: string;
  update: (data: Record<string, unknown>) => Promise<void>;
  intervalSeconds?: number;
  maxAttempts?: number;
};