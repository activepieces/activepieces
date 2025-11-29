import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { agentCommon, AI_MODELS } from '../common';
import { AgentOutputField, AgentOutputFieldType, AgentPieceProps, AgentTaskStatus, isNil, McpTool, McpToolType } from '@activepieces/shared';
import { dynamicTool, hasToolCall, stepCountIs, streamText, tool } from 'ai';
import { inspect } from 'util';
import { z, ZodObject } from 'zod';
import { agentOutputBuilder } from '../common/agent-output-builder';

const TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus';

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
    const { prompt, maxSteps, aiModel } = context.propsValue
    const agentTools = context.propsValue.agentTools as McpTool[]
    const selectedModel = agentCommon.getModelById(aiModel as string)
    const model = agentCommon.createModel({
      model: selectedModel,
      token: context.server.token,
      baseURL: `${context.server.apiUrl}v1/ai-providers/proxy/${selectedModel.provider}`,
      flowId: context.flows.current.id,
    })

    const outputBuilder = agentOutputBuilder(prompt)
    const stream = streamText({
      model: model,
      prompt: `
${prompt}

<important_note>
You must call \`${TASK_COMPLETION_TOOL_NAME}\` at the end wether you have achieved the goal or not, otherwise your work will be marked as failed.
</important_note>
`,
      system: `
You are a helpful, proactive AI assistant.
Today's date is ${new Date().toISOString().split('T')[0]}.

Help the user finish their goal quickly and accurately.
        `.trim(),
      stopWhen: [
        stepCountIs(maxSteps),
        hasToolCall(TASK_COMPLETION_TOOL_NAME),
      ],
      tools: {
        [TASK_COMPLETION_TOOL_NAME]: dynamicTool({
          description: 'You must call this tool as the final step to indicate whether you have achieved the assigned goal.',
          inputSchema: z.object({
            success: z.boolean().describe('Set to true if the assigned goal was achieved, or false if the task was abandoned or failed.'),
            output: z.object({
              ...(isNil(context.propsValue.structuredOutput) ? {} : structuredOutputSchema(context.propsValue.structuredOutput as AgentOutputField[])?.shape ?? {}),
            }),
          }),
          execute: async (params) => {
            const { success, output } = params as { success: boolean, output?: Record<string, unknown> }
            console.log("TASK TOOL IS CALLED " + JSON.stringify(params))
            outputBuilder.setStatus(success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED)

            if (!isNil(output)) {
              outputBuilder.setStructuredOutput(output)
            }
            return {}
          },
        }),

      }
    });

    for await (const chuck of stream.fullStream) {
      switch (chuck.type) {
        case 'text-delta': {
          outputBuilder.addMarkdown(chuck.text)
          break
        }
        case 'tool-call': {
          if (isTaskCompletionToolCall(chuck.toolName)) {
            continue
          }
          outputBuilder.startToolCall({
            toolName: chuck.toolName,
            toolCallId: chuck.toolCallId,
            input: chuck.input as Record<string, unknown>,
            agentTools
          })
          break
        }
        case 'tool-result': {
          if (isTaskCompletionToolCall(chuck.toolName)) {
            continue
          }
          outputBuilder.finishToolCall({
            toolCallId: chuck.toolCallId,
            output: chuck.output as Record<string, unknown>,
          })
          break;
        }
        case 'error': {
          outputBuilder.fail({ message: "Error running agent: " + inspect(chuck.error) })
          break;
        }
      }
//      await context.output.update({ data: outputBuilder.build() })

    }
    const { status } = outputBuilder.build()
    if (status == AgentTaskStatus.IN_PROGRESS) {
      outputBuilder.fail({})
    }

    return outputBuilder.build()
  }
});


const isTaskCompletionToolCall = (toolName: string) => toolName === TASK_COMPLETION_TOOL_NAME

function structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
  const shape: Record<string, z.ZodType> = {}

  for (const field of outputFields) {
    switch (field.type) {
      case AgentOutputFieldType.TEXT:
        shape[field.displayName] = z.string()
        break
      case AgentOutputFieldType.NUMBER:
        shape[field.displayName] = z.number()
        break
      case AgentOutputFieldType.BOOLEAN:
        shape[field.displayName] = z.boolean()
        break
      default:
        shape[field.displayName] = z.any()
    }
  }

  return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
}