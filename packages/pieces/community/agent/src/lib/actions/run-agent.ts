import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { agentCommon, AI_MODELS } from '../common';
import { AgentOutputField, AgentPieceProps, AgentTaskStatus, isNil, McpTool, spreadIfDefined } from '@activepieces/shared';
import { APICallError, hasToolCall, jsonSchema, stepCountIs, streamText, tool, zodSchema } from 'ai';
import { AIErrorResponse } from '@activepieces/common-ai';
import { agentOutputBuilder } from './agent-output';
import { z4 } from 'zod';

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
    const structuredOutput = context.propsValue.structuredOutput as AgentOutputField[]
    const { server } = context

    const selectedModel = agentCommon.getModelById(aiModel as string)
    const model = agentCommon.createModel({
      model: selectedModel,
      token: server.token,
      baseURL: `${server.apiUrl}v1/ai-providers/proxy/${selectedModel.provider}`,
      flowId: context.flows.current.id,
    })

    const outputBuilder = agentOutputBuilder(prompt)
    const stream = streamText({
      model: model,
      prompt: prompt,
      system: `
            You are a helpful, proactive AI assistant. Today's date is ${new Date().toISOString().split('T')[0]}.

            Help the user get things done quickly and accurately.

            CRITICAL FINAL STEP:
            When the user's goal is complete (or clearly failed/abandoned), you MUST end your response by calling the tool exactly once:

            - markAsFinished({ success: true })  → goal achieved or user is satisfied  
            - markAsFinished({ success: false }) → goal failed, impossible, or user gave up

            Decide based on context. When in doubt, default to true.
            Never ask the user if it succeeded — just call the tool and stop.
        `.trim(),
      stopWhen: [
        stepCountIs(maxSteps),
        hasToolCall('taskCompletion'),
      ],
      tools: {
        taskCompletion: tool({
          description: 'This tool must be called when you have reached a conclusion or completed your assigned task.',
          inputSchema: zodSchema(
            z4.object({
              success: z4.boolean().describe('Set to true if the assigned goal was achieved, or false if the task was abandoned or failed.'),
              ...spreadIfDefined('output', isNil(structuredOutput) ? undefined : agentCommon.getStructuredOutputSchema(structuredOutput)),
            })
          ),
          execute: async ({ success, output }) => {
            outputBuilder.setStatus(success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED)
            if (!isNil(output)) {
              outputBuilder.setStructuredOutput(output)
            }
            return {

            }
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
          outputBuilder.startToolCall({
            toolName: chuck.toolName,
            toolCallId: chuck.toolCallId,
            input: chuck.input as Record<string, unknown>,
            agentTools
          })
          break
        }
        case 'tool-result': {
          outputBuilder.finishToolCall({
            toolCallId: chuck.toolCallId,
            output: chuck.output as Record<string, unknown>,
          })
          break;
        }
        case 'error': {
          if (APICallError.isInstance(chuck.error)) {
            const errorResponse = (chuck.error as { data: AIErrorResponse })?.data
            outputBuilder.fail({ message: "Error running agent: " + (errorResponse?.error?.message ?? JSON.stringify(chuck.error)) })
          }
          else {
            outputBuilder.fail({ message: "Error running agent: " + JSON.stringify(chuck.error) })
          }
          break;
        }
      }
      await context.output.update({ data: outputBuilder.build() })

    }
    const { status } = outputBuilder.build()
    if (status == AgentTaskStatus.IN_PROGRESS) {
      outputBuilder.fail({})
    }
    return outputBuilder.build()
  }
});