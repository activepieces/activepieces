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
  ConversationMessage,
  AgentResult,
} from '@activepieces/shared';
import { HttpMethod } from '@activepieces/pieces-common';

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
    const { prompt, aiProviderModel } = context.propsValue;
    const agentProviderModel = aiProviderModel as AgentProviderModel

    const hasStructuredOutput =
      !isNil(context.propsValue.structuredOutput) &&
      context.propsValue.structuredOutput.length > 0;
    const structuredOutput = hasStructuredOutput ? context.propsValue.structuredOutput as AgentOutputField[] : undefined;
    const agentTools = context.propsValue.agentTools as AgentTool[];

    let conversation: ConversationMessage[] = genericAgentUtils.addUserMessage([], prompt);
    let status: AgentTaskStatus = AgentTaskStatus.IN_PROGRESS;

    const buildResult = (): AgentResult => ({
      prompt,
      conversation,
      status,
      structuredOutput: genericAgentUtils.extractStructuredOutput(conversation),
    });

    try {
      const response = await runAgentApi(context, {
        provider: agentProviderModel.provider,
        modelId: agentProviderModel.model,
        projectId: context.project.id,
        tools: agentTools,
        state: {},
        structuredOutput,
        conversation: conversation,
      });

      let isFailed = false;
      await new Promise<void>((resolve, reject) => {
        readStream({
          response,
          onChunk: async (chunk) => {
            const updated = parseToJsonIfPossible(chunk) as AgentStreamingUpdate
            if (updated.event === AgentStreamingEvent.AGENT_STREAMING_UPDATE) {
              conversation = genericAgentUtils.streamChunk(conversation, updated.data);
              await context.output.update({ data: buildResult() });
              if (updated.data.part.type === 'tool-call' && updated.data.part.status === 'error') {
                isFailed = true;
              }
            }
          },
          onEnd: async () => {
            if (isFailed) reject();
            resolve();
          },
        });
      })
      
      status = AgentTaskStatus.COMPLETED;
      await context.output.update({ data: buildResult() });

    } catch (error) {
      status = AgentTaskStatus.FAILED;
      await context.output.update({ data: buildResult() });
    }

    return buildResult();
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