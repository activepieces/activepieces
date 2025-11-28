import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { agentCommon, AI_MODELS } from '../common';
import {  AgentOutputField, AgentPieceProps, AgentResult, AgentTaskStatus, assertNotNullOrUndefined, ContentBlockType, isNil, McpTool, ToolCallContentBlock, ToolCallStatus } from '@activepieces/shared';
import { APICallError } from 'ai';
import { AIErrorResponse } from '@activepieces/common-ai';

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run the AI assistant to complete your task.',
  auth: PieceAuth.None(),
  props: {
    [AgentPieceProps.PROMPT]: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    [AgentPieceProps.AI_MODEL]: Property.StaticDropdown({
      displayName: 'AI Model',
      required: true,
      description: 'Choose your AI model and provider. Different models offer varying capabilities, speeds, and costs. OpenAI models are best for general tasks, Anthropic excels at analysis, and Google Gemini offers competitive pricing.',
      options: {
        options: AI_MODELS.map(model => ({
          label: `(${model.provider}) ${model.displayName}`,
          value: model.id,
        })),
      },
    }),
    [AgentPieceProps.AGENT_TOOLS]: Property.Array({
      displayName: 'MCP Tools',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Type',
          required: true
        }),
        toolName: Property.ShortText({
          displayName: 'Tool Name',
          required: true
        }),
        mcpId: Property.ShortText({
          displayName: 'Mcp Id',
          required: false
        }),
        pieceMetadata: Property.Json({
          displayName: 'Piece Metadata',
          required: false,
        }),
        flow: Property.Json({
          displayName: 'Populated Flow',
          required: false,
        }),
        flowId: Property.ShortText({
          displayName: 'Flow Id',
          required: false
        })
      }
    }),
    [AgentPieceProps.STRUCTURED_OUTPUT]: Property.Array({
      displayName: 'Structured Output',
      defaultValue: undefined,
      required: false,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Display Name',
          required: true
        }),
        description: Property.ShortText({
          displayName: 'Description',
          required: false
        }),
        type: Property.ShortText({
          displayName: 'Type',
          required: true
        })
      }
    }),
    [AgentPieceProps.MAX_STEPS]: Property.Number({
      displayName: 'Max steps',
      description: 'The numbder of interations the agent can do',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { prompt, maxSteps, agentTools, structuredOutput, aiModel } = context.propsValue
    const { server } = context

  const result: AgentResult = {
      prompt,
      steps: [],
      status: AgentTaskStatus.IN_PROGRESS,
      message: null,
      structuredOutput: null
    }

    const selectedModel = agentCommon.getModelById(aiModel as string)
    const baseURL = `${server.apiUrl}v1/ai-providers/proxy/${selectedModel.provider}`
    const model = agentCommon.createModel({
      model: selectedModel,
      token: server.token,
      baseURL,
      flowId: context.flows.current.id,
    })

    const stream = await context.agent.run({
      maxSteps,
      model,
      prompt,
      systemPrompt: agentCommon.systemPrompt(),
      experimental_output: agentCommon.getStructuredOutputSchema(structuredOutput as AgentOutputField[] || [])
    })

    let message = ''

    for await (const chuck of stream.fullStream) {
        if (chuck.type === 'text-delta') {
          message += chuck.text
        }
        if (chuck.type === 'tool-call') {
          const toolData = chuck
          const metadata = agentCommon.getToolMetadata({
            toolName: toolData.toolName,
            baseTool: {
              toolName: toolData.toolName,
              toolCallId: toolData.toolCallId,
              type: ContentBlockType.TOOL_CALL,
              status: ToolCallStatus.IN_PROGRESS,
              input: toolData.input as Record<string, unknown>,
              output: undefined,
              startTime: new Date().toISOString(),
            },
            tools: agentTools as McpTool[]
          })
          result.steps.push(metadata)
          await context.output.update({ data: { ...result }})
        }
        if (chuck.type === 'tool-result') {
          const toolIdx = result.steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && block.toolCallId === chuck.toolCallId)
          const tool = result.steps[toolIdx] as ToolCallContentBlock
          assertNotNullOrUndefined(tool, 'Last block must be a tool call')
          result.steps[toolIdx] = {
              ...tool,
              status: ToolCallStatus.COMPLETED,
              endTime: new Date().toISOString(),
              output: chuck.output,
          }
          context.output.update({ data: { ...result }})
        }
        if (chuck.type === 'error') {
          if (APICallError.isInstance(chuck.error)) {
              const errorResponse = (chuck.error as { data: AIErrorResponse })?.data
              result.message = errorResponse?.error?.message ?? JSON.stringify(chuck.error)
          }
          else {
              result.message = "Error running agent"
          }
          result.status = AgentTaskStatus.FAILED
          return result
        }
    }

    result.status = AgentTaskStatus.COMPLETED
    result.structuredOutput = !isNil(structuredOutput) && await agentCommon.collectStream(stream.experimental_partialOutputStream)
    result.message = message

    return result 
  }
});