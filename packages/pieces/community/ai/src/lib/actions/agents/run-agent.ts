import {
  createAction,
  Property,
  PieceAuth,
  ArraySubProps,
  ActionContext,
} from '@activepieces/pieces-framework';

import {
  AgentOutputField,
  AgentPieceProps,
  AgentTaskStatus,
  isNil,
  AgentTool,
  AgentProviderModel,
  ExecuteAgentRequest,
  readStream,
  AgentStreamingUpdate,
  AgentStreamingEvent,
  parseToJsonIfPossible,
  genericAgentUtils,
} from '@activepieces/shared';
import { agentOutputBuilder } from './agent-output-builder';
import { inspect } from 'util';
import { agentUtils } from './utils';
import {  HttpMethod } from '@activepieces/pieces-common';

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

    const outputBuilder = agentOutputBuilder(prompt);
    const hasStructuredOutput =
      !isNil(context.propsValue.structuredOutput) &&
      context.propsValue.structuredOutput.length > 0;
    const structuredOutput = hasStructuredOutput ? context.propsValue.structuredOutput as AgentOutputField[] : undefined;
    const agentTools = context.propsValue.agentTools as AgentTool[];
    const errors: { type: string; message: string; details?: unknown }[] = [];

    try {
      const response = await runAgentApi(context, {
        provider: agentProviderModel.provider,
        modelId: agentProviderModel.model,
        projectId: context.project.id,
        tools: agentTools,
        state: {},
        structuredOutput,
        conversation: genericAgentUtils.addUserMessage([], prompt),
      });

      await new Promise<void>((resolve) => {
        readStream({
          response,
          onChunk: async (chunk) => {
            try {
              const messageJson = parseToJsonIfPossible(chunk) as AgentStreamingUpdate
              if (messageJson.event === AgentStreamingEvent.AGENT_STREAMING_UPDATE) {
                const part = messageJson.data.part;
                let shouldResolve = false;

                if (part.type === 'text') {
                  outputBuilder.addMarkdown(part.message);
                }

                if (part.type === 'tool-call') {

                  if (agentUtils.isTaskCompletionToolCall(part.toolName)) {
                  } 

                  else if (part.status === 'completed') {

                    outputBuilder.finishToolCall({
                      toolCallId: part.toolCallId,
                      output: part.output as Record<string, unknown>,
                    });

                  } else if (part.status === 'error') {

                    errors.push({
                      type: 'tool-error',
                      message: `Tool ${part.toolName} failed`,
                      details: part.error,
                    });
                    outputBuilder.failToolCall({
                      toolCallId: part.toolCallId,
                    });

                  } else {
                    outputBuilder.startToolCall({
                      toolName: part.toolName,
                      toolCallId: part.toolCallId,
                      input: part.input as Record<string, unknown>,
                      agentTools: agentTools,
                    });
                  }
                }

                await context.output.update({ data: outputBuilder.build() });
                if (shouldResolve) resolve()
              }
            } catch (error) {
              errors.push({
                type: 'chunk-processing-error',
                message: 'Error processing chunk',
                details: inspect(error),
              });
            }
          },
          onEnd: async () => {
            resolve()
          },
        });
      })
      
      // const stream = streamText({
      //   model: model,
      //   system: agentUtils.getPrompts(prompt).system,
      //   prompt: agentUtils.getPrompts(prompt).prompt,
      //   tools,
      //   stopWhen: [stepCountIs(maxSteps), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
      // });

      if (errors.length > 0) {
        const errorSummary = errors.map(e => `${e.type}: ${e.message}: ${e.details}`).join('\n');
        console.error('errors', errorSummary);
        outputBuilder.addMarkdown(`\n\n**Errors encountered:**\n${errorSummary}`);
        outputBuilder.fail({ message: 'Agent completed with errors' });
        await context.output.update({ data: outputBuilder.build() });
      } else {
        outputBuilder.setStatus(AgentTaskStatus.COMPLETED)
        await context.output.update({ data: outputBuilder.build() });
      }

    } catch (error) {
      const errorMessage = `Agent failed unexpectedly: \n${error}`;
      console.error('errorMessage', errorMessage);
      outputBuilder.addMarkdown(`\n\n**Errors encountered:**\n`);
      outputBuilder.fail({ message: errorMessage });
      await context.output.update({ data: outputBuilder.build() });
    }

    return outputBuilder.build();
  }
});

const runAgentApi = async (context: ActionContext, request: ExecuteAgentRequest) => {

  const response = await fetch(`${context.server.apiUrl}v1/generic-agent/execute`, {
    method: HttpMethod.POST,
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.server.token}`,
    },
  });
  if (response.status !== 200) {
    const error = await response.json();
    throw new Error(`
      code: ${error.code}\n
      message: ${error.message}\n
    `);
  }

  return response as { body: ReadableStream<Uint8Array> };
}