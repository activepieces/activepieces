import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { AIErrorResponse, AIUsageFeature, createAIModel } from '@activepieces/common-ai'
import { agentCommon } from '../common';
import {  AgentResult, AgentTaskStatus, assertNotNullOrUndefined, ContentBlockType, isNil, ToolCallContentBlock, ToolCallStatus } from '@activepieces/shared';
import { openai } from '@ai-sdk/openai';
import { APICallError, stepCountIs, streamText } from 'ai';

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
              value: agent.id,
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
    maxSteps: Property.Number({
      displayName: 'Max steps',
      description: 'The numbder of interations the agent can do',
      required: true,
      defaultValue: 20,
    })
  },
  async run(context) {
    const { agentId, prompt, maxSteps } = context.propsValue
    const { server } = context

    const result: AgentResult = {
      prompt,
      steps: [],
      status: AgentTaskStatus.IN_PROGRESS,
      message: null,
    }

    const agent = await agentCommon.getAgent({ agentId, token: server.token, apiUrl: server.publicUrl })
    const mcp = await agentCommon.getMcp({ mcpId: agent.mcpId, token: server.token, apiUrl: server.publicUrl })

    const agentToolInstance: Awaited<ReturnType<typeof agentCommon.agentTools>> = await agentCommon.agentTools({
        agent,
        publicUrl: server.publicUrl,
        token: server.token,
        mcp,
    })

    const baseURL = `${server.apiUrl}v1/ai-providers/proxy/openai`
    const model = createAIModel({
      providerName: 'openai',
      modelInstance: openai('gpt-4.1'),
      engineToken: server.token,
      baseURL,
      metadata: {
        feature: AIUsageFeature.AGENTS,
        agentid: agentId,
      },
    })

    const systemPrompt = agentCommon.constructSystemPrompt(prompt)
    const { fullStream } = streamText({
      model,
      system: systemPrompt,
      prompt: prompt,
      stopWhen: stepCountIs(maxSteps),
      tools: await agentToolInstance.tools()
    })

    let currentText = ''
    for await (const chunk of fullStream) {
        if (chunk.type === 'text-delta') {
            currentText += chunk.text
        }
        else if (chunk.type === 'tool-call') { 
            if (currentText.length > 0) {
                result.steps.push({
                    type: ContentBlockType.MARKDOWN,
                    markdown: currentText,
                })
                currentText = ''
            }
            const metadata = agentCommon.getMetadata(chunk.toolName, mcp, {
                toolName: chunk.toolName,
                toolCallId: chunk.toolCallId,
                type: ContentBlockType.TOOL_CALL,
                status: ToolCallStatus.IN_PROGRESS,
                input: chunk.input as Record<string, unknown>,
                output: undefined,
                startTime: new Date().toISOString(),
            })
            result.steps.push(metadata)
        }
        else if (chunk.type === 'tool-result') {
            const lastBlockIndex = result.steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && block.toolCallId === chunk.toolCallId)
            const lastBlock = result.steps[lastBlockIndex] as ToolCallContentBlock
            assertNotNullOrUndefined(lastBlock, 'Last block must be a tool call')
            result.steps[lastBlockIndex] = {
                ...lastBlock,
                status: ToolCallStatus.COMPLETED,
                endTime: new Date().toISOString(),
                output: chunk.output,
            }
        }
        else if (chunk.type === 'error') {
            result.status = AgentTaskStatus.FAILED
            if (APICallError.isInstance(chunk.error)) {
                const errorResponse = (chunk.error as unknown as { data: AIErrorResponse })?.data
                result.message = errorResponse?.error?.message ?? JSON.stringify(chunk.error)
            }
            else {
                result.message = agentCommon.concatMarkdown(result.steps ?? []) + '\n' + JSON.stringify(chunk.error, null, 2)
            }
            return result
        }
    }

    const markAsComplete = result.steps.find(agentCommon.isMarkAsComplete) as ToolCallContentBlock | undefined
    
    result.status = !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED
    result.message = agentCommon.concatMarkdown(result.steps)

    return result
  }
});