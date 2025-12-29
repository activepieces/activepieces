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
} from '@activepieces/shared';
import { hasToolCall, stepCountIs, streamText } from 'ai';
import { agentOutputBuilder } from './agent-output-builder';
import { createAIModel } from '../../common/ai-sdk';
import { aiProps } from '../../common/props';
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
    [AgentPieceProps.AI_PROVIDER]: aiProps({ modelType: 'text' }).provider,
    [AgentPieceProps.AI_MODEL]: aiProps({ modelType: 'text' }).model,
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
    const { prompt, maxSteps, model: modelId, provider } = context.propsValue;

    const model = await createAIModel({
      modelId,
      provider: provider as AIProviderName,
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
    const structuredOutput = hasStructuredOutput ? context.propsValue.structuredOutput as AgentOutputField[] : undefined
    const agentTools = context.propsValue.agentTools as AgentTool[];

    const { mcpClients, tools } = await constructAgentTools({
      context,
      agentTools,
      model,
      outputBuilder,
      structuredOutput
    })

    const stream = streamText({
      model: model,
      system: agentUtils.getPrompts(prompt).system,
      prompt: agentUtils.getPrompts(prompt).prompt,
      tools,
      stopWhen: [stepCountIs(maxSteps), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
      onFinish: async () => {
        await Promise.all(mcpClients.map(async (client) => client.close()))
      },
    });

    for await (const chuck of stream.fullStream) {
      switch (chuck.type) {
        case 'text-delta': {
          outputBuilder.addMarkdown(chuck.text);
          break;
        }
        case 'tool-call': {
          if (agentUtils.isTaskCompletionToolCall(chuck.toolName)) {
            continue;
          }
          outputBuilder.startToolCall({
            toolName: chuck.toolName,
            toolCallId: chuck.toolCallId,
            input: chuck.input as Record<string, unknown>,
            agentTools: agentTools,
          });
          break;
        }
        case 'tool-result': {
          if (agentUtils.isTaskCompletionToolCall(chuck.toolName)) {
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