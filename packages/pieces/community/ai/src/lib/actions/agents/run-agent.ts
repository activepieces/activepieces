import {
  createAction,
  Property,
  PieceAuth,
  ArraySubProps,
} from '@activepieces/pieces-framework';

import {
  AgentOutputField,
  AgentPieceProps,
  AgentTaskStatus,
  isNil,
  AgentTool,
  TASK_COMPLETION_TOOL_NAME,
  AIProviderName,
  AgentProviderModel,
} from '@activepieces/shared';
import { hasToolCall, stepCountIs, streamText } from 'ai';
import { agentOutputBuilder } from './agent-output-builder';
import { createAIModel } from '../../common/ai-sdk';
import { inspect } from 'util';
import { agentUtils } from './utils';
import { constructAgentTools } from './tools';

const agentToolArrayItems: ArraySubProps<boolean> = {
  type: Property.ShortText({
    displayName: 'Tool Type',
    required: true,
  }),

  toolName: Property.ShortText({
    displayName: 'Tool Name',
    required: true,
  }),

  pieceMetadata: Property.Json({
    displayName: 'Piece Metadata',
    required: false,
  }),

  externalFlowId: Property.ShortText({
    displayName: 'Flow External ID',
    required: false,
  }),

  serverUrl: Property.ShortText({
    displayName: 'MCP Server URL',
    required: false,
  }),
  protocol: Property.ShortText({
    displayName: 'Protocol',
    required: false,
  }),
  auth: Property.Json({
    displayName: 'Auth Configuration',
    required: false,
  }),
}

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Handles complex, multi-step tasks by reasoning through problems, using tools accurately, and iterating until the job is done.',
  auth: PieceAuth.None(),
  props: {
    [AgentPieceProps.PROMPT]: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    [AgentPieceProps.AI_PROVIDER_MODEL]: Property.Object({
      displayName: 'AI Model',
      required: true,
    }),
    [AgentPieceProps.AGENT_TOOLS]: Property.Array({
      displayName: 'Agent Tools',
      required: false,
      properties: agentToolArrayItems,
    }),
    [AgentPieceProps.STRUCTURED_OUTPUT]: Property.Array({
      displayName: 'Structured Output',
      defaultValue: undefined,
      required: false,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Display Name',
          required: true,
        }),
        description: Property.ShortText({
          displayName: 'Description',
          required: false,
        }),
        type: Property.ShortText({
          displayName: 'Type',
          required: true,
        }),
      },
    }),
    [AgentPieceProps.MAX_STEPS]: Property.Number({
      displayName: 'Max steps',
      description: 'The numbder of interations the agent can do',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { prompt, maxSteps, aiProviderModel } = context.propsValue;
    const agentProviderModel = aiProviderModel as AgentProviderModel

    const model = await createAIModel({
      modelId: agentProviderModel.model,
      provider: agentProviderModel.provider as AIProviderName,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
      projectId: context.project.id,
      flowId: context.flows.current.id,
      runId: context.run.id,
    });
    const outputBuilder = agentOutputBuilder(prompt);
    const hasStructuredOutput =
      !isNil(context.propsValue.structuredOutput) &&
      context.propsValue.structuredOutput.length > 0;
    const structuredOutput = hasStructuredOutput ? context.propsValue.structuredOutput as AgentOutputField[] : undefined;
    const agentTools = context.propsValue.agentTools as AgentTool[];
    const { mcpClients, tools } = await constructAgentTools({
      context,
      agentTools,
      model,
      outputBuilder,
      structuredOutput
    });

    const errors: { type: string; message: string; details?: unknown }[] = [];

    try {
      const stream = streamText({
        model: model,
        system: agentUtils.getPrompts(prompt).system,
        prompt: agentUtils.getPrompts(prompt).prompt,
        tools,
        stopWhen: [stepCountIs(maxSteps), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
        onFinish: async () => {
          await Promise.all(mcpClients.map(async (client) => client.close()));
        },
      });

      for await (const chunk of stream.fullStream) {
        try {
          switch (chunk.type) {
            case 'text-delta': {
              outputBuilder.addMarkdown(chunk.text);
              break;
            }
            case 'tool-call': {
              if (agentUtils.isTaskCompletionToolCall(chunk.toolName)) {
                continue;
              }
              outputBuilder.startToolCall({
                toolName: chunk.toolName,
                toolCallId: chunk.toolCallId,
                input: chunk.input as Record<string, unknown>,
                agentTools: agentTools,
              });
              break;
            }
            case 'tool-result': {
              if (agentUtils.isTaskCompletionToolCall(chunk.toolName)) {
                continue;
              }
              outputBuilder.finishToolCall({
                toolCallId: chunk.toolCallId,
                output: chunk.output as Record<string, unknown>,
              });
              break;
            }
            case 'tool-error': {
              errors.push({
                type: 'tool-error',
                message: `Tool ${chunk.toolName} failed`,
                details: chunk.error,
              });
              outputBuilder.failToolCall({
                toolCallId: chunk.toolCallId,
              });
              break;
            }
            case 'error': {
              errors.push({
                type: 'stream-error',
                message: 'Error during streaming',
                details: inspect(chunk.error),
              });
              break;
            }
          }
          await context.output.update({ data: outputBuilder.build() });
        } catch (innerError) {
          errors.push({
            type: 'chunk-processing-error',
            message: 'Error processing chunk',
            details: inspect(innerError),
          });
        }
      }

      if (errors.length > 0) {
        const errorSummary = errors.map(e => `${e.type}: ${e.message}`).join('\n');
        outputBuilder.addMarkdown(`\n\n**Errors encountered:**\n${errorSummary}`);
        outputBuilder.fail({ message: 'Agent completed with errors' });
        await context.output.update({ data: outputBuilder.build() });
      } else {
        outputBuilder.setStatus(AgentTaskStatus.COMPLETED)
      }

    } catch (error) {
      const errorMessage = `Agent failed unexpectedly: ${inspect(error)}`;
      outputBuilder.fail({ message: errorMessage });
      await context.output.update({ data: outputBuilder.build() });
      await Promise.all(mcpClients.map(async (client) => client.close()));
    }

    return outputBuilder.build();
  }
});