import {
  createAction,
  Property,
  PieceAuth,
  ArraySubProps,
  ExecutionType,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { AgentPieceProps, AgentProviderModel, AgentResult, AgentTaskStatus, ContentBlockType } from '@activepieces/pieces-framework';
import { buildWebSearchOptionsProperty } from '../../common/web-search';

const AGENT_STEP_TIMEOUT_MS = 30 * 60 * 1_000;

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

  sourceType: Property.ShortText({
    displayName: 'Source Type',
    required: false,
  }),
  sourceId: Property.ShortText({
    displayName: 'Source ID',
    required: false,
  }),
  sourceName: Property.ShortText({
    displayName: 'Source Name',
    required: false,
  }),
}

export const runAgent = createAction({
  audience: 'both',
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Handles complex, multi-step tasks by reasoning through problems, using tools accurately, and iterating until the job is done.',
  aiMetadata: { description: 'Runs an agent loop where the model reasons over your prompt and calls the tools you attach (piece actions, sub-flows, MCP servers, knowledge bases, optional web search), iterating until the task completes or Max Steps is reached. Pick it when the work needs tool use or an unknown number of steps; prefer askAi for a single prompt-in/answer-out call, or classifyText and extractStructuredData for one narrow analysis. Requires a prompt, an AI Model and a Max Steps cap; not idempotent, as the agent performs side effects through its tools.', idempotent: false },
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
      description: 'The number of iterations the agent can do',
      required: true,
      defaultValue: 20,
    }),
    [AgentPieceProps.WEB_SEARCH]: Property.Checkbox({
      displayName: 'Web Search',
      required: false,
      defaultValue: false,
      description:
        'Whether to use web search to find information for the AI to use.',
    }),
    [AgentPieceProps.WEB_SEARCH_OPTIONS]: buildWebSearchOptionsProperty(
      (propsValue) => {
        const aiProviderModel = propsValue['aiProviderModel'] as AgentProviderModel | undefined;
        return { provider: aiProviderModel?.provider, model: aiProviderModel?.model };
      },
      ['webSearch', 'aiProviderModel'],
      { showIncludeSources: false },
    ),
  },
  async run(context) {
    if (context.executionType === ExecutionType.RESUME) {
      const result = context.resumePayload.body as AgentResult | undefined;
      if (isNil(result) || isNil(result.status)) {
        return {
          prompt: context.propsValue.prompt,
          steps: [{ type: ContentBlockType.MARKDOWN, markdown: 'The agent did not report a result before the step timed out.' }],
          status: AgentTaskStatus.FAILED,
        } as AgentResult;
      }
      return result;
    }

    const waitpoint = await context.run.createWaitpoint({
      type: 'WEBHOOK',
      resumeDateTime: new Date(Date.now() + AGENT_STEP_TIMEOUT_MS).toUTCString(),
    });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/agents/runs`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.server.token },
      body: {
        instruction: context.propsValue.prompt,
        flowRunId: context.run.id,
        waitpointId: waitpoint.id,
        tools: context.propsValue.agentTools ?? [],
        ...(isNil(context.propsValue.structuredOutput) || context.propsValue.structuredOutput.length === 0
          ? {}
          : { structuredOutput: context.propsValue.structuredOutput }),
      },
    });

    context.run.waitForWaitpoint(waitpoint.id);
    return {};
  },
});