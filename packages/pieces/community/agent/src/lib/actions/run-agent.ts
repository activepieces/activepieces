import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { AIErrorResponse } from '@activepieces/common-ai'
import { agentCommon, ProviderModelMap, AIProvider, AI_MODELS_BY_PROVIDER } from '../common';
import {  AgentOutputField, AgentPieceProps, AgentResult, AgentTaskStatus, assertNotNullOrUndefined, ContentBlockType, isNil, McpTool, ToolCallContentBlock, ToolCallStatus } from '@activepieces/shared';
import { APICallError, stepCountIs, streamText } from 'ai';

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run the AI assistant to complete your task.',
  auth: PieceAuth.None(),
  props: {
    [AgentPieceProps.MCP_ID]: Property.ShortText({
      displayName: 'MCP',
      description: 'Mcp id',
      required: true,
    }),
    [AgentPieceProps.PROMPT]: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    [AgentPieceProps.AI_PROVIDER]: Property.StaticDropdown({
      displayName: 'AI Provider',
      required: true,
      description: 'Choose your AI provider',
      options: {
        options: Object.values(AIProvider).map((provider) => ({
          label: provider.charAt(0).toUpperCase() + provider.slice(1),
          value: provider,
        })),
      },
    }),
    [AgentPieceProps.AI_MODEL]: Property.Dropdown({
      displayName: 'AI Model',
      required: true,
      description: 'Select the model based on the chosen provider',
      refreshers: ['aiProvider'],
      async options({ aiProvider }) {
        if (!aiProvider) {
          return {
            options: [],
            disabled: true,
            placeholder: 'Select a provider first',
          };
        }

        return {
          options: AI_MODELS_BY_PROVIDER[aiProvider as AIProvider],
        };
      },
    }),
    [AgentPieceProps.AGENT_TOOLS]: Property.Array({
      displayName: 'MCP Tools',
      required: false
    }),
    [AgentPieceProps.STRUCTURED_OUTPUT]: Property.Array({
      displayName: 'Structured Output',
      defaultValue: undefined,
      required: false,
    }),
    [AgentPieceProps.MAX_STEPS]: Property.Number({
      displayName: 'Max steps',
      description: 'The numbder of interations the agent can do',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { mcpId, prompt, maxSteps, agentTools, structuredOutput, aiModel, aiProvider } = context.propsValue
    const { server } = context

    const result: AgentResult = {
      prompt,
      steps: [],
      status: AgentTaskStatus.IN_PROGRESS,
      message: null,
    }

    const mcp = await agentCommon.getMcp({ mcpId: mcpId, token: server.token, apiUrl: server.publicUrl })
    const agentToolInstance: Awaited<ReturnType<typeof agentCommon.agentTools>> = await agentCommon.agentTools({
        outputFields: structuredOutput as AgentOutputField[],
        publicUrl: server.publicUrl,
        token: server.token,
        tools: agentTools as McpTool[],
        mcp
    })

    const baseURL = `${server.apiUrl}v1/ai-providers/proxy/${aiProvider}`
    const model = agentCommon.createModelForProvider({
      provider: aiProvider as AIProvider,
      model: aiModel as ProviderModelMap[AIProvider],
      token: server.token,
      baseURL,
      agentId: mcpId,
    });


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