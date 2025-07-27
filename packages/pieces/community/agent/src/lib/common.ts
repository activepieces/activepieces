import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { Agent, SeekPage, AgentRun, AgentTaskStatus } from "@activepieces/shared"
import { StatusCodes } from "http-status-codes";


export const agentCommon = {
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
  async pollAgentRunStatus(params: PollAgentRunParams): Promise<AgentRun> {
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

      await update(lastAgentRun)

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
  agentId: string
}

type PollAgentRunParams = {
  publicUrl: string;
  token: string;
  agentRunId: string;
  update: (data: AgentRun) => Promise<void>;
  intervalSeconds?: number;
  maxAttempts?: number;
};