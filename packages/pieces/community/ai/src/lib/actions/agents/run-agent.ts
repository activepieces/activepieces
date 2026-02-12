import {
  createAction,
  Property,
  PieceAuth,
} from '@activepieces/pieces-framework';
import {
  AgentOutputField,
  AgentOutputFieldType,
  AgentPieceProps,
  AgentTaskStatus,
  isNil,
  AgentTool,
  TASK_COMPLETION_TOOL_NAME,
} from '@activepieces/shared';
import { dynamicTool, hasToolCall, stepCountIs, streamText } from 'ai';
import { z, ZodObject } from 'zod';
import { agentOutputBuilder } from './agent-output-builder';
import { createAIModel } from '../../common/ai-sdk';
import { aiProps } from '../../common/props';
import { inspect } from 'util';

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
    [AgentPieceProps.AI_PROVIDER]: aiProps({ modelType: 'text' }).provider,
    [AgentPieceProps.AI_MODEL]: aiProps({ modelType: 'text' }).model,
    [AgentPieceProps.AGENT_TOOLS]: Property.Array({
      displayName: 'Agent Tools',
      required: false,
      properties: {
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
        flowId: Property.ShortText({
          displayName: 'Flow Id',
          required: false,
        }),
      },
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
      description: 'The number of iterations the agent can do',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { prompt, maxSteps, model: modelId, provider: providerId } = context.propsValue;

    const model = await createAIModel({
      modelId,
      providerId,
      engineToken: context.server.token,
      apiUrl: context.server.apiUrl,
    });

    const outputBuilder = agentOutputBuilder(prompt);
    const hasStructuredOutput =
      !isNil(context.propsValue.structuredOutput) &&
      context.propsValue.structuredOutput.length > 0;
    const agentToolsMetadata = context.propsValue.agentTools as AgentTool[];
    const agentTools = await context.agent.tools({
      tools: agentToolsMetadata,
      model: model,
    });
    const stream = streamText({
      model: model,
      prompt: `
${prompt}

<important_note>
As your FINAL ACTION, you must call the \`${TASK_COMPLETION_TOOL_NAME}\` tool to indicate if the task is complete or not. 
Call this tool only once you have done everything you can to achieve the user's goal, or if you are unable to continue. 
If you do not make this final call, your work will be considered unsuccessful.
</important_note>
`,
      system: `
You are a helpful, proactive AI assistant.
Today's date is ${new Date().toISOString().split('T')[0]}.

Help the user finish their goal quickly and accurately.
        `.trim(),
      stopWhen: [stepCountIs(maxSteps), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
      tools: {
        ...agentTools,
        [TASK_COMPLETION_TOOL_NAME]: dynamicTool({
          description:
            "This tool must be called as your FINAL ACTION to indicate whether the assigned goal was accomplished. Call it only when you have completed the user's task, or if you are unable to continue. Once you call this tool, you should not take any further actions.",
          inputSchema: z.object({
            success: z
              .boolean()
              .describe(
                'Set to true if the assigned goal was achieved, or false if the task was abandoned or failed.'
              ),
            ...(hasStructuredOutput
              ? {
                  output: z
                    .object(
                      structuredOutputSchema(
                        context.propsValue
                          .structuredOutput as AgentOutputField[]
                      )?.shape ?? {}
                    )
                    .nullable()
                    .describe(
                      'The structured output of your task. This is optional and can be omitted if you have not achieved the goal.'
                    ),
                }
              : {
                  output: z
                    .string()
                    .nullable()
                    .describe(
                      'The message to the user with the result of your task. This is optional and can be omitted if you have not achieved the goal.'
                    ),
                }),
          }),
          execute: async (params) => {
            const { success, output } = params as {
              success: boolean;
              output?: Record<string, unknown>;
            };
            outputBuilder.setStatus(
              success ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED
            );
            if (hasStructuredOutput && !isNil(output)) {
              outputBuilder.setStructuredOutput(output);
            }
            if (!hasStructuredOutput && !isNil(output)) {
              outputBuilder.addMarkdown(output as unknown as string);
            }
            return {};
          },
        }),
      },
    });

    for await (const chuck of stream.fullStream) {
      switch (chuck.type) {
        case 'text-delta': {
          outputBuilder.addMarkdown(chuck.text);
          break;
        }
        case 'tool-call': {
          if (isTaskCompletionToolCall(chuck.toolName)) {
            continue;
          }
          outputBuilder.startToolCall({
            toolName: chuck.toolName,
            toolCallId: chuck.toolCallId,
            input: chuck.input as Record<string, unknown>,
            agentTools: agentToolsMetadata,
          });
          break;
        }
        case 'tool-result': {
          if (isTaskCompletionToolCall(chuck.toolName)) {
            continue;
          }
          outputBuilder.finishToolCall({
            toolCallId: chuck.toolCallId,
            output: chuck.output as Record<string, unknown>,
          });
          break;
        }
        case 'error': {
          outputBuilder.fail({
            message: 'Error running agent: ' + inspect(chuck.error),
          });
          break;
        }
      }
      await context.output.update({ data: outputBuilder.build() });
    }
    const { status } = outputBuilder.build();
    if (status == AgentTaskStatus.IN_PROGRESS) {
      outputBuilder.fail({});
    }

    return outputBuilder.build();
  },
});

const isTaskCompletionToolCall = (toolName: string) =>
  toolName === TASK_COMPLETION_TOOL_NAME;

function structuredOutputSchema(
  outputFields: AgentOutputField[]
): ZodObject | undefined {
  const shape: Record<string, z.ZodType> = {};

  for (const field of outputFields) {
    switch (field.type) {
      case AgentOutputFieldType.TEXT:
        shape[field.displayName] = z.string();
        break;
      case AgentOutputFieldType.NUMBER:
        shape[field.displayName] = z.number();
        break;
      case AgentOutputFieldType.BOOLEAN:
        shape[field.displayName] = z.boolean();
        break;
      default:
        shape[field.displayName] = z.any();
    }
  }

  return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
}
