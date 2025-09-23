import { AIErrorResponse } from "@activepieces/common-ai";
import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { Agent, SeekPage, ContentBlockType, agentbuiltInToolsNames, RunAgentRequestBody, AgentRun, UpdateAgentRunRequestBody, AgentStepBlock, AgentTaskStatus, isNil, ToolCallContentBlock } from "@activepieces/shared"
import { APICallError } from "ai";
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

  async createAgentRun(params: CreateAgentRun) {
    const { agentId, apiUrl, prompt, token } = params;
    const body: RunAgentRequestBody = {
      externalId: agentId,
      prompt,
    }
    
    const response = await httpClient.sendRequest<AgentRun>({
      method: HttpMethod.POST,
      url: `${apiUrl}v1/agent-runs`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body
    })
    
    if (response.status !== StatusCodes.OK) {
      throw new Error(response.body.message)
    }
      
    return response.body
  },

  async updateAgentRun(params: UpdateAgentRunParams) {
    const { apiUrl, token, agentRunId, agentResult } = params;
    
    const response = await httpClient.sendRequest<AgentRun>({
      method: HttpMethod.POST,
      url: `${apiUrl}v1/agent-runs/${agentRunId}/update`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: agentResult
    })
    
    return response.body
  },

  createInitialAgentResult(projectId: string): UpdateAgentRunRequestBody & { steps: AgentStepBlock[] } {
    return {
      projectId,
      startTime: new Date().toISOString(),
      steps: [],
      message: '',
      status: AgentTaskStatus.IN_PROGRESS,
      output: undefined,
    }
  },

  handleStreamError(chunk: any, agentResult: UpdateAgentRunRequestBody & { steps: AgentStepBlock[] }): void {
    agentResult.status = AgentTaskStatus.FAILED
    
    if (APICallError.isInstance(chunk.error)) {
      const errorResponse = (chunk.error as unknown as { data: AIErrorResponse })?.data
      agentResult.message = errorResponse?.error?.message ?? JSON.stringify(chunk.error)
    } else {
      agentResult.message = this.concatMarkdown(agentResult.steps ?? []) + '\n' + JSON.stringify(chunk.error, null, 2)
    }
    
    agentResult.finishTime = new Date().toISOString()
  },

  finalizeAgentResult(
    agentResult: UpdateAgentRunRequestBody & { steps: AgentStepBlock[] }, 
    currentText: string
  ): UpdateAgentRunRequestBody & { steps: AgentStepBlock[] } {
    if (currentText.length > 0) {
      agentResult.steps.push({
        type: ContentBlockType.MARKDOWN,
        markdown: currentText,
      })
    }

    const markAsComplete = agentResult.steps.find(this.isMarkAsComplete) as ToolCallContentBlock | undefined
    
    return {
      ...agentResult,
      output: markAsComplete?.input,
      status: !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED,
      message: this.concatMarkdown(agentResult.steps),
      finishTime: new Date().toISOString(),
    }
  },

  isMarkAsComplete(block: any): boolean {
    return block.type === ContentBlockType.TOOL_CALL && block.toolName === agentbuiltInToolsNames.markAsComplete
  },

  concatMarkdown(blocks: AgentStepBlock[]): string {
    return blocks
      .filter((block) => block.type === ContentBlockType.MARKDOWN)
      .map((block) => block.markdown)
      .join('\n')
  },

  constructSystemPrompt(systemPrompt: string): string {
    return `
You are an autonomous assistant designed to efficiently achieve the user's goal.
YOU MUST ALWAYS call the mark as complete tool with the output or message wether you have successfully completed the task or not.
You MUST ALWAYS do the requested task before calling the mark as complete tool.
**Today's Date**: ${new Date().toISOString()}  
Use this to interpret time-based queries like "this week" or "due tomorrow."
---
${systemPrompt}
    `.trim()
  },
}

type ListAgents = {
  publicUrl: string
  token: string
}

type CreateAgentRun = {
  agentId: string;
  prompt: string;
  apiUrl: string;
  token: string
}

type UpdateAgentRunParams = {
  apiUrl: string;
  token: string;
  agentRunId: string;
  agentResult: UpdateAgentRunRequestBody & { steps: AgentStepBlock[] };
}